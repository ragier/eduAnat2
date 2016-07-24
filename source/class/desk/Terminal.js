/**
 * A web terminal
 * @ignore (io)
 * @ignore (Terminal)
 */

qx.Class.define("desk.Terminal", 
{
	extend : qx.ui.container.Composite,

    /**
    * Constructor
    */
	construct : function ( options ) {
	    options = options || {};
		this.base(arguments);
		this.set({
            layout :  new qx.ui.layout.HBox(),
		    padding : 1
		});

        this.__rand = Math.floor( 100000000 * Math.random());

        if (options.standalone) {
            var win = this.__window = new qx.ui.window.Window();
            win.set({
                layout : new qx.ui.layout.HBox(),
                width : 646,
                height : 380,
                contentPadding : 0,
                caption : 'Terminal'
            });
            win.add( this, {flex : 1} );
            win.open();
            win.center();

            win.addListener( 'close', function () {
                if ( this.__tabview ) {
                    this.__tabview.getChildren().forEach( function (child) {
                        child.getChildren()[0].dispose();
                    });
                    return;
                }
                this.dispose();
            }, this);

            win.addListener( 'mouseup', function () {
                this.__container.children[0].focus();
            }, this);

            win.addListener('keydown', this.__onKeyDownForNewTerminal, this, true);
        }

        this.__html = new qx.ui.embed.Html();
        this.__html.setHtml( '<pre class="terminaljs" id = "' + this.__rand + '"></pre>' );
        this.__html.setBackgroundColor( 'black' );
        this.add( this.__html, { flex : 1 } );
        this.__html.addListenerOnce( 'appear', this.__onAppear, this );
	},

    destruct : function () {
        this.__term.off('data', this.__term._sendData);
        this.__socket.removeEventListener('message', this.__term._getMessage);
        this.__socket.disconnect();
        delete this.__term.socket;
        this.__term = 0;
    },

    members : {
        __window : null,
        __socket : null,
        __tabview : null,
        __container : null,
        __term : null,
        __html : null,
        __nCols : null,
        __nRows : null,
        __rand : null,

		__getSocket : function ( namespace ) {
            var socket;
            desk.Actions.getInstance().getSocket().io.connecting
				.forEach( function (soc) {
					if (soc.nsp === namespace ) {
						socket = soc;
					}
			});

            return socket || io( namespace );
		},

		__onAppear : function () {
			var socket = this.__getSocket( '/xterm' );

            if ( socket.connected ) {
				socket.emit('newTerminal', {name : '' + this.__rand});
                this.__init();
            } else {
				socket.once( 'connect', function () {
					socket.emit('newTerminal', {name : '' + this.__rand});
					this.__init();
				}.bind( this ));
			}
        },

        __init : function () {
            this.__socket = this.__getSocket('/xterm' + this.__rand);
            this.__container = document.getElementById('' + this.__rand);
            this.__term = new Terminal();
            this.__attach( this.__term, this.__socket );
            this.__term.open( this.__container );
            this.__term.on( 'keydown', this.__onKeyDownForSelectNext.bind(this));
            var style = this.__container.style;
            style.fontSize = "13px";
            style.lineHeight = "14px";

            this.__term.on('paste', function (data, ev) {
                this.__term.write(data);
            }.bind(this));

            this.__resize();
            this.addListener( 'appear', this.__resize, this );
            this.addListener( 'resize', function () {
                if ( this.__html.isVisible() ) {
                    this.__resize();
                } 
            }, this );
        },

        __resize : function () {
            this.__container.children[0].focus();
            var size = this.getInnerSize();
            var nCols = Math.floor( size.width / 8 );
            var nRows = Math.floor( (size.height - 5)/ 14 );
            if (nCols * nRows === 0) {
                return;
            }
            if ( ( this.__nCols == nCols ) && ( this.__nRows === nRows) ) {
                return;
            }
            this.__nCols = nCols;
            this.__nRows = nRows;
            this.debug('resize : ', nCols, nRows);
            this.__term.resize( nCols, nRows );
            this.__socket.emit("resize", {nCols : nCols, nRows : nRows});
        },

        __add : function (el) {
            var element = this.__tabview.addElement('terminal', el);
			element.setShowCloseButton(true);
            element.setPadding(0);
            element.setPaddingTop(0);
			element.fireEvent('resize');
            element.addListener( 'close', function () {
                element.getChildren()[0].dispose();
                if ( !this.__tabview.getChildren().length ) this.__window.close();
            }, this);
            el.__tabview = this.__tabview;
			return element;
        },

        __selectNext : function (dir) {
            if ( !this.__tabview ) return;
            var children = this.__tabview.getChildren();
            var selected = this.__tabview.getSelection()[0];
            var index = children.indexOf( selected );
            var newIndex = ( children.length + index + dir ) % children.length;
            this.__tabview.setSelection( [ children[newIndex] ]);
        },

        __onKeyDownForSelectNext : function (e) {
            if ( !e || !e.ctrlKey) return;
            switch ( e.keyCode ) {
                case 37:
                    this.__selectNext( -1 );
                    break;
                case 39 :
                    this.__selectNext( 1 );
                    break;
            }
        },

        __onKeyDownForNewTerminal : function (event) {
            if ( event.isCtrlOrCommandPressed() 
                && event.isAltPressed()
                && ( event.getKeyIdentifier() === 'T') ) {

                if ( !this.__tabview ) {
                    this.__tabview = new desk.TabView();
                    this.__tabview.setPadding(0);
                    this.__tabview.setContentPadding(0);
                    this.__window.add(this.__tabview, { flex : 1 } );
                    this.__add(this);
                }
                var terminal = new desk.Terminal();
                var element = this.__add(terminal);
    			element.getButton().execute();
            }
        },

        __attach : function (term, socket, bidirectional, buffered) {
            bidirectional = (typeof bidirectional == 'undefined') ? true : bidirectional;
            term.socket = socket;
            
            term._flushBuffer = function () {
                term.write(term._attachSocketBuffer);
                term._attachSocketBuffer = null;
                clearTimeout(term._attachSocketBufferTimer);
                term._attachSocketBufferTimer = null;
            };
            
            term._pushToBuffer = function (data) {
                if (term._attachSocketBuffer) {
                    term._attachSocketBuffer += data;
                } else {
                    term._attachSocketBuffer = data;
                    setTimeout(term._flushBuffer, 10);
                }
            };
            
            term._getMessage = function (data) {
                if (buffered) {
                    term._pushToBuffer(data);
                } else {
                    term.write(data);
                }
            };
            
            term._sendData = function (data) {
                socket.send(data);
            };
            
            socket.addEventListener('message', term._getMessage);
            
            if (bidirectional) {
                term.on('data', term._sendData);
            }
        }
    }
});
