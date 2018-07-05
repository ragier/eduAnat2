
/**
 * @ignore (ImageData)<
 * @ignore (THREE*)
 * @ignore (chroma*)
 * @ignore (require*)
 * @ignore (performance*)
 */


qx.Class.define("desk.IfeContainer", {
    extend: qx.ui.container.Composite,

    /**
     * constructor
     */
    construct: function(sideViewer) {
	    this.base(arguments);

	    //hack to include
	    new desk.ProgressBar();

	    this.__sideViewer = sideViewer;

	    var layout = new qx.ui.layout.HBox();
        layout.setSpacing(1);

        this.setLayout(layout);

        this.createUI();
        this.removeAll();
    },

    destruct: function() {

    },

    events: {

    },

    properties: {

    },

    members: {
        __MPR: null,
        __meshViewer: null,

        __volumeAnat: null,
        __mesh3DModel : null,

        __buttonOpenAnat: null,
        __buttonOpenFunc: null,
        __buttonCloseAll : null,

        __menu : null,
        __subMenuAnat: null,
        __subMenuFunc: null,
        __subMenuButtons : null,

        __collapseButton : null,

        __IRMAnatName : null,
        __anatButtonMeta : null,

        __contrastSlider : null,
        __brightnessSlider : null,

        __colors : null,
        __widthMenu : 220,

        __sideViewer : null,

        /**
         * create UI
         */
        createUI: function() {
            var that = this;
            var MPR = this.createMPR();

            var menu = this.__menu = this.createMenu();
            this.add(menu, { flex:0 });

            this.__collapseButton = this.createCollapseButton();
            this.add(this.__collapseButton, { flex: 0 });

            this.add(MPR, { flex: 6 });

            this.__buttonOpenFunc.addListener("execute", function () {
                var target;
                if (!that.__subMenuFunc[0].__volumeFunc && !that.__subMenuFunc[1].__volumeFunc) {
                    //Aucun calque ouvert
                    target = that.__subMenuFunc[0];
                }
                var dialog = require('electron').remote.dialog;

                if (that.__subMenuFunc[0].__volumeFunc && !that.__subMenuFunc[1].__volumeFunc) {
                    //Calque ouvert sur le 1er slot
                    var index = dialog.showMessageBox({
                      type : "question",
                      title : "Ouverture d'un calque fonctionnel",
                      message : "Ajouter un second calque ou remplacer l'actuel?",
                      buttons : ['Ajouter', 'Remplacer','Annuler'],
                      defaultId : 2
                    });

                    if (index == 2) return;

                    if (index == 1) target = that.__subMenuFunc[0];
                      else target = that.__subMenuFunc[1];
                }

                if (!that.__subMenuFunc[0].__volumeFunc && that.__subMenuFunc[1].__volumeFunc) {
                    //Calque ouvert sur le 1er slot
                    var index = dialog.showMessageBox({
                      type : "question",
                      title : "Ouverture d'un calque fonctionnel",
                      message : "Ajouter un second calque ou remplacer l'actuel?",
                      buttons : ['Ajouter', 'Remplacer','Annuler'],
                      defaultId : 2
                    });

                    if (index == 2) return;

                    if (index == 1) target = that.__subMenuFunc[1];
                      else target = that.__subMenuFunc[0];
                }

                if (that.__subMenuFunc[0].__volumeFunc && that.__subMenuFunc[1].__volumeFunc) {
                  //Calque ouvert sur le 1er slot
                  var index = dialog.showMessageBox({
                    type : "question",
                    title : "Ouverture d'un calque fonctionnel",
                    message : "Remplacer quel calque fonctionnel?",
                    buttons : ['Remplacer le 1er', 'Remplacer le 2ème','Annuler'],
                    defaultId : 2
                  });

                  if (index == 2) return;

                  if (index == 1) target = that.__subMenuFunc[1];
                    else target = that.__subMenuFunc[0];
                }



                target.addFuncFile(function () {
                    //Before
                  window.setTimeout(function() {
                      that.__buttonOpenAnat.setEnabled(false);
                      that.__buttonOpenFunc.setEnabled(false);
                  }, 1);

                }, function() {
                    //After
                    that.__buttonOpenFunc.setEnabled(true);
                    that.__buttonOpenAnat.setEnabled(true);
                    that.__buttonCloseAll.setEnabled(true);
                });
            });
        },

        createMenu: function() {

            var that = this;
            //Menu container
            var layout = new qx.ui.layout.VBox();
            layout.setSpacing(10);
            var container = new qx.ui.container.Composite(layout);
            container.set({
                width: this.__widthMenu+50
            })
            container.setPadding(10);
            container.setPaddingRight(0);

            container.add(new qx.ui.core.Spacer(), {flex: 1});

            this.__subMenuButtons = this.createSubMenuButtons();
            container.add(this.__subMenuButtons);

            container.add(new qx.ui.core.Spacer(), {flex: 1});

            this.__subMenuAnat = this.createSubMenuAnat();
            container.add(this.__subMenuAnat);

            container.add(new qx.ui.core.Spacer(), {flex: 1});

            this.__subMenuFunc = [];

            this.__subMenuFunc[0] = new desk.FuncLayer(this.__MPR, this.__meshViewer);
            container.add(this.__subMenuFunc[0], {flex: 1});
            this.__subMenuFunc[1] = new desk.FuncLayer(this.__MPR, this.__meshViewer);
            container.add(this.__subMenuFunc[1], {flex: 1});

            container.add(new qx.ui.core.Spacer(), {flex: 1});

            if (that.__sideViewer) {
                container.add(this.createAbout());
            }

            return container;
        },


        alert : function (message, title) {
            // create the window instance
            var root = qx.core.Init.getApplication().getRoot();

            if (title === undefined) title = this.tr("Erreur : type de fichier");

            var win = new qx.ui.window.Window( title );
            win.setLayout(new qx.ui.layout.VBox(10));

            win.set({
                width : 400,
                alwaysOnTop : true,
                showMinimize : false,
                showMaximize : false,
                centerOnAppear : true,
                modal : true,
                movable : false,
                resizable : false,
                allowMaximize : false,
                allowMinimize : false
            });

            var label = new qx.ui.basic.Label(message);

            label.set({rich: true, wrap : true});

            // label to show the e.g. the alert message
            win.add(label);

            // "ok" button to close the window
            var alertBtn = new qx.ui.form.Button("OK");

            root.add(win);

            alertBtn.addListener("execute", win.close.bind(win));

            win.add(alertBtn);

            alertBtn.setMarginLeft(100);
            alertBtn.setMarginRight(100);

            win.open();

        },


        createAbout : function () {
            var button = new qx.ui.form.Button(this.tr("A propos de ")+" EduAnat2 v0.1.0").set({decorator: null});

            var win = new qx.ui.window.Window(this.tr("A propos de ")+" EduAnat2 v0.1.0");
            win.set({
                width : 500,
                height : 600,
                alwaysOnTop : true,
                showMinimize : false,
                showMaximize : false,
                centerOnAppear : true,
                modal : true,
                movable : false,
                allowMaximize : false,
                allowMinimize : false,
                resizable : false
            });

            win.setLayout(new qx.ui.layout.VBox(10));

            var logos = new qx.ui.container.Composite(new qx.ui.layout.HBox());

            //logos.add(new qx.ui.core.Spacer(), {flex: 1});
            logos.add(new qx.ui.basic.Image("resource/ife/logo_ife.jpg") );
            //logos.add(new qx.ui.core.Spacer(), {flex: 1});
            logos.add(new qx.ui.basic.Image("resource/ife/logo_ens.jpg") );
            //logos.add(new qx.ui.core.Spacer(), {flex: 1});

            win.add(logos);

            win.add( new qx.ui.basic.Label([
                "Mentions légales :",
                ""
              ].join('<br>') ).set({
                rich : true,
                width: 460
            }) );

            qx.core.Init.getApplication().getRoot().add(win, {left:20, top:20});

            button.addListener("execute", win.open.bind(win));

            return button;
        },


        profiling : function (volume) {
                var slicer = volume.getUserData("workerSlicer").slicer;
                var prop = volume.getUserData("workerSlicer").properties;
                console.log(prop);
                var dir = 0;
                var slice = 0;


                var t0 = performance.now();
                var sum = 0;

              function prof(dir) {
                slicer.generateSlice([slice, dir], function () {
                  slice++;
                  if (slice < prop.dimensions[dir])
                    this.profiling(dir, slice);
                  else {
                    var t1 = performance.now() - t0;
                    slice = 0;
                    t0 = performance.now();
                    sum +=t1;
                    console.log("PERFORMANCE " + dir + " (ns) : ", 1000*1000*t1/prop.dimensions[dir]/ prop.dimensions[(dir+1)%3]/ prop.dimensions[(dir+2)%3]);

                    console.log("PERFORMANCE " + dir + " (ms) : ", t1/prop.dimensions[dir]);
                    if (dir < 2) prof(dir+1);
                    else
                      console.log("end, total : ", sum);
                  }

                });
              }

              setTimeout(function () {
                  prof(0);
              }, 5000);

        },

        addAnatFile: function(evt) {
            var dialog = require('electron').remote.dialog;
            var filesList = dialog.showOpenDialog({
              filters : [
                {name: 'Anat Nifti Image', extensions: ['anat.nii.gz']},
                {name: 'Nifti Image', extensions: ['nii.gz']},
                {name: 'All Files', extensions: ['*']}

              ],
              properties: ['openFile']
            });

            if (!filesList || !filesList.length) return;
            var name = require("path").basename(filesList[0]);

            var that = this;

            if (name.substr(name.length -7) !== ".nii.gz") {
                dialog.showMessageBox({
                  type : "error",
                  title : "Erreur : type de fichier",
                  message : "Ne sont acceptés que les fichiers Nifti compressés (.nii.gz).",
                  buttons : ['Ok']
                });

                return;
            }

            this.removeAll();

            window.setTimeout(function() {
                that.__buttonOpenAnat.setEnabled(false);
            }, 1);

            this.__MPR.addVolume(filesList[0], {
                workerSlicer: true,
                noworker: true
            }, function(err, volume) {
                that.__volumeAnat = volume;
                volume.setUserData("path", filesList[0]);

                that.__anatButtonMeta.exclude();
                that.loadMeta(volume, function (err, meta) {
                  if (err === null) { //show info button
                    that.__anatButtonMeta.show();
                  }
                  else { //show info button
                    that.__anatButtonMeta.exclude();
                  }
                });


                var volSlice = that.__MPR.getVolumeSlices(volume);
                var meshes = that.__meshViewer.attachVolumeSlices(volSlice);

                that.__IRMAnatName.setValue(name);
                that.__buttonOpenFunc.setEnabled(true);
                that.__buttonOpenAnat.setEnabled(true);
                that.__subMenuAnat.show();

                that.__buttonCloseAll.setEnabled(true);

                var bbox = new THREE.Box3();
                meshes.forEach( function (obj) {
                    bbox.union( new THREE.Box3().setFromObject(obj) );
                });

                that.resetMeshView();
                var group = new THREE.Group();
                that.__meshViewer.addMesh(group);

                var center = bbox.max.add(bbox.min).divideScalar ( 2 ) ;
                var l = new THREE.Vector3().copy(bbox.max).sub(bbox.min);
                var maxSize = Math.max(l.x, l.y, l.z);

                //var size = 25;
                var size = 0.2*maxSize;
                console.log("Size : ", size);

                group.add( that.createSprite("droite",  size, new THREE.Vector3(2*bbox.max.x-bbox.min.x+size*1.5, center.y, center.z)) );
                group.add( that.createSprite("gauche",  size, new THREE.Vector3(bbox.min.x-size*1.85, center.y, center.z)) );
                group.add( that.createSprite("ventre",  size, new THREE.Vector3(center.x, bbox.max.y*2+size*1.5, center.z)) );
                group.add( that.createSprite("dos",     size, new THREE.Vector3(center.x, bbox.min.y-size*1.25, center.z)) );
                group.add( that.createSprite("avant",   size, new THREE.Vector3(center.x, center.y, bbox.max.z*2+size*1.25)) );
                group.add( that.createSprite("arrière", size, new THREE.Vector3(center.x, center.y, bbox.min.z-size*1.25)) );

                //Update Zoom Limite
                that.__MPR.getViewers().concat(that.__meshViewer).forEach(function (viewer) {
                  viewer.getControls().setMinZoom(0.3*maxSize);
                  viewer.getControls().setMaxZoom(20*maxSize);
                });

                var path = filesList[0];
                if (path) {
                    var meshPath;
                    if (name.substr(name.length -12) == ".anat.nii.gz") {
                        meshPath = path.substr(0, path.length-12) + ".stl";
                    }
                    else if (name.substr(name.length -7) == ".nii.gz") {
                      var meshPath = path.substr(0, path.length-7) + ".stl";
                    }

                    var oReq = new XMLHttpRequest();
                    oReq.responseType = "arraybuffer";
                    oReq.onload = function (res) {
                       that.addMesh(oReq.response);
                    };
                    oReq.open("get", meshPath, true);
                    oReq.send();
                }
            });
        },



        addMeshFile: function(evt) {
            var file = evt.getData();
            var that = this;


            var name = file.getBrowserObject().name;


            if (name.substr(name.length -4) !== ".stl") {
                dialog.showMessageBox({
                  type : "error",
                  title : "Erreur : type de fichier",
                  message : "Ne sont acceptés que les maillages au format .stl",
                  buttons : ['Ok']
                });

                return;
            }


            this.removeMesh();

            var reader = new FileReader();
            reader.onload = function(e) {
                that.addMesh(e.target.result);
            }

            reader.readAsArrayBuffer(file.getBrowserObject());
        },

        addMesh : function (arrayBuffer) {
            var loader = new THREE.STLLoader();

            var geometry = loader.parse( arrayBuffer );

            //https://stackoverflow.com/questions/35843167/three-js-smoothing-normals-using-mergevertices
            var tempGeo = new THREE.Geometry().fromBufferGeometry(geometry);
            tempGeo.mergeVertices();
            // after only mergeVertices my textrues were turning black so this fixed normals issues
            tempGeo.computeVertexNormals();
            tempGeo.computeFaceNormals();
            geometry = new THREE.BufferGeometry().fromGeometry(tempGeo);

            //Rendering BackSide & Scale -1 pour être raccord avec les vues (hack : inversion des normales)
            var material = new THREE.MeshPhongMaterial( {
                  color: 0xff5533,
                  specular: 0x111111,
                  shininess: 50,
                  transparent : true,
                  opacity : 0.7,
                  side: THREE.BackSide } );

            var mesh = new THREE.Mesh( geometry, material );
            mesh.renderOrder = 4;

            mesh.scale.set(-1, 1, 1);

            var prop = this.__volumeAnat.getUserData('workerSlicer').properties;
            var offsetX = prop.dimensions[0] * prop.spacing[0];
            mesh.position.set(offsetX, 0, 0);


            mesh.flipSided = true;
            //flip every vertex normal in mesh by multiplying normal by -1
            for(var i = 0; i<mesh.geometry.attributes.normal.array.length; i++) {
                mesh.geometry.attributes.normal.array[i] = -mesh.geometry.attributes.normal.array[i];
            }

            mesh.material.needsUpdate = true;

            mesh.geometry.attributes.normal.needsUpdate = true; // required after the first render
            mesh.geometry.normalsNeedUpdate = true;

            this.__meshViewer.addMesh( mesh );
            this.__mesh3DModel = mesh;
            this.resetMeshView();
            this.__buttonCloseAll.setEnabled(true);
        },

        removeMesh : function () {
            /* TODO : remove mesh from viewer and dispose memory */
            if (this.__mesh3DModel) {
                this.__meshViewer.removeMesh(this.__mesh3DModel);
                this.__mesh3DModel = undefined;
            }
        },

        createCollapseButton: function() {
            var button = new qx.ui.basic.Image("resource/ife/left.png");
            button.set({
                width: 16,
                scale:true
            });
            var layout = new qx.ui.layout.VBox();
            layout.setAlignY("middle");
            var container = new qx.ui.container.Composite(layout);
            container.add(button);
            var that = this;
            button.addListener("click", function() {
                var target = that.getChildren()[0];
                if (target.isVisible()) {
                    target.exclude();
                    button.setSource("resource/ife/right.png");
                } else {
                    target.show();
                    button.setSource("resource/ife/left.png");
                }
            });
            return container;
        },

        createMPR: function() {
            //MPR container
            var options = {
                workerSlicer: true,
                alwaysDisplaySlider: true,
                zoomOnWheel: true,
                maxZoom:2000,
                minZoom:30
            };

            var MPR = new desk.MPRContainer(null, options);

            var meshViewer = this.__meshViewer = new desk.SceneContainer({
                  noOpts:true,
                  sliceOnWheel:false,
                  maxZoom:2000,
                  minZoom:30,
                  cameraFov : 35});

            var button = new qx.ui.form.Button("R").set({opacity : 0.5, width : 30});
            meshViewer.add (button, {right : 0, bottom : 0});

            var screenshot = new qx.ui.form.Button(null, "resource/desk/camera-photo.png").set({opacity : 0.5, width : 30, height : 29});
            meshViewer.add (screenshot, {right : 30, bottom : 0});
            screenshot.addListener("execute", function () {

              var remote = require('electron').remote;
              var webContents = remote.getCurrentWebContents();
              webContents.capturePage(function (image) {
                var dialog = remote.dialog;
                var fn = dialog.showSaveDialog({
                  defaultPath: 'capture.png',
                  filters : [{name: 'Image', extensions: ['png']}]
                });
                if (fn && fn !== null)
                  remote.require('fs').writeFile(fn, image.toPng());
              });
            });

            MPR.setCustomContainer(meshViewer);

            this.__MPR = MPR;
            return MPR;

        },

        link : function (target) {
            this.__MPR.link(target.__MPR);
            this.__meshViewer.link(target.__meshViewer);
        },

        unlink : function () {
            this.__MPR.__viewers.forEach (function (viewer) {
                viewer.unlink();
            });
            this.__meshViewer.unlink();
        },


        createSubMenuButtons: function() {
            var that = this;

            var layout = new qx.ui.layout.VBox();
            var container = new qx.ui.container.Composite(layout);

            layout.setSpacing(10);
            container.setPadding(10);
            container.setPaddingRight(0);

            /* Button Open Anat */

            var buttonOpenAnat = this.__buttonOpenAnat = new qx.ui.form.Button(this.tr("Ouvrir une image anatomique"), 'resource/ife/open_A_small.png');

            buttonOpenAnat.getChildControl("label").setAllowGrowX(true);
            buttonOpenAnat.getChildControl("label").setTextAlign("left");

            buttonOpenAnat.addListener("execute", this.addAnatFile.bind(this));

            container.add(buttonOpenAnat);

            var buttonOpenFunc = this.__buttonOpenFunc = new qx.ui.form.Button(this.tr("Ouvrir un calque fonctionnel"), 'resource/ife/open_F_small.png');

            buttonOpenFunc.getChildControl("label").setAllowGrowX(true);
            buttonOpenFunc.getChildControl("label").setTextAlign("left");

            container.add(buttonOpenFunc);

            /* Button Close all */
            var buttonCloseAll = this.__buttonCloseAll = new qx.ui.form.Button(this.tr("Tout fermer"), 'resource/ife/close_small.png');
            buttonCloseAll.getChildControl("label").setAllowGrowX(true);
            buttonCloseAll.getChildControl("label").setTextAlign("left");
            buttonCloseAll.addListener("execute", this.removeAll.bind(this));
            buttonCloseAll.setEnabled(false);
            container.add(buttonCloseAll);

            /* Button compare */
            if (that.__sideViewer) {
                var buttonCompare = new qx.ui.form.Button(this.tr("Comparer deux IRM"));

                buttonCompare.addListener("execute", function () {
                    if (that.__sideViewer.isVisible()) {
                        that.__sideViewer.exclude();
                        buttonCompare.setLabel(that.tr("Comparer deux IRM"));
                        //that.unlink();

                        that.switchMenu(true);
                        that.__sideViewer.switchMenu(true);

                    } else {
                        that.__sideViewer.show();
                        buttonCompare.setLabel(that.tr("Fermer la comparaison"));
                        //that.link(that.__sideViewer);

                        that.switchMenu(false);
                        that.__sideViewer.switchMenu(false);

                    }
                });

                container.add(buttonCompare);
            }

            return container;

        },

        switchMenu : function (vertical) {
            var layout = vertical ? new qx.ui.layout.HBox() : new qx.ui.layout.VBox();
            this.setLayout(layout);

            this.remove(this.__menu);

            if (!vertical) this.remove(this.__collapseButton); //remove collapse


            var menu = this.__menu = new qx.ui.container.Composite(vertical ? new qx.ui.layout.VBox() : new qx.ui.layout.HBox());

            menu.add(new qx.ui.core.Spacer(), {flex: 1});
            menu.add(this.__subMenuButtons);

            var target;
            if (vertical) {
                target = menu;
            }
            else {
                target = new qx.ui.container.Composite(new qx.ui.layout.VBox());
            }

            target.add(this.__subMenuAnat);
            target.add(this.__subMenuFunc[0]);
            target.add(this.__subMenuFunc[1]);

            menu.add(new qx.ui.core.Spacer(), {flex: 1});

            if (target !== menu) menu.add(target);

            menu.add(new qx.ui.core.Spacer(), {flex: 1});

            this.addAt(menu, vertical?0:1);

            if (vertical) this.addAt(this.__collapseButton, 1);

        },


        createSubMenuAnat: function() {
            var that = this;

            var layout = new qx.ui.layout.VBox();
            var container = new qx.ui.container.Composite(layout);

            var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox());

                titleContainer.add(new qx.ui.basic.Label().set({
                    value: "<b>" + this.tr("Image anatomique") + " : </b>",
                    rich: true
                }));

                titleContainer.add(new qx.ui.core.Spacer(), {flex: 1});


                var button_meta = this.__anatButtonMeta = new qx.ui.form.Button(null, 'resource/ife/info_small.png').set({
                    decorator: null
                });
                titleContainer.add(button_meta);
                button_meta.addListener("execute", function() {
                    that.showMeta(that.__volumeAnat);
                });


            container.add(titleContainer);

            this.__IRMAnatName = new qx.ui.basic.Label().set({
                rich: true,
                wrap : true
            });

            this.__IRMAnatName.setAllowGrowX(false);

            container.add(this.__IRMAnatName);


            /* Gestion du contraste */
            var contrastLabel = new qx.ui.basic.Label(this.tr("Contraste") + " : 1.00");
            container.add(contrastLabel);
            var contrastSlider = this.contrastSlider = new qx.ui.form.Slider();
            contrastSlider.set({
                minimum: -28,
                maximum: 28,
                singleStep: 1
            });
            contrastSlider.addListener("changeValue", function(e) {
                var value = Math.pow(10, e.getData() / 40);
                contrastLabel.setValue(that.tr("Contraste") + " : " + value.toFixed(2));
                if (that.__volumeAnat) {
                  that.__volumeAnat.getUserData('slices').forEach(function(volumeSlice) {
                      volumeSlice.setContrast(value);
                  });
                }
            });
            container.add(contrastSlider);


            /* Gestion de la luminosité */
            var brightnessLabel = new qx.ui.basic.Label(this.tr("Luminosité") + " : 0.5");
            container.add(brightnessLabel);
            var brightnessSlider = this.brightnessSlider = new qx.ui.form.Slider();
            brightnessSlider.set({
                minimum: 0,
                maximum: 100,
                singleStep: 1,
                value : 50
            });
            brightnessSlider.addListener("changeValue", function(e) {
                var value = e.getData() / 100;
                brightnessLabel.setValue(that.tr("Luminosité") + " : " + value.toFixed(2));
                if (that.__volumeAnat) {
                  that.__volumeAnat.getUserData('slices').forEach(function(volumeSlice) {
                      volumeSlice.setBrightness((value-0.5)*2 );
                  });
                }
            });
            container.add(brightnessSlider);

            container.add(new qx.ui.core.Spacer(), {
                flex: 1
            });
            return container;
        },

        showMeta : function (volume) {
            var metadonnees = volume.getUserData("metadonnees");
            var that = this;

            if (!metadonnees) {
              dialog.showMessageBox({
                type : "error",
                title : "Erreur",
                message : "Métadonnées indisponibles",
                buttons : ['Ok']
              });
            }

            this.alert(metadonnees, "Métadonnées");
        },

        loadMeta : function (volume, callback) {
            var path = volume.getUserData("path");
            path = path.substr(0, path.length-7) + ".xml";

            var oReq = new XMLHttpRequest();
            oReq.onload = function (res) {
               volume.setUserData(this.responseText);
               callback(null, this.responseText);
            };

            oReq.onerror = function () {
                callback("error");
            };

            oReq.open("get", path, true);
            oReq.send();
        },

        removeAll: function() {
          this.__subMenuFunc[0].removeFunc();
          this.__subMenuFunc[1].removeFunc();

            this.__MPR.removeAllVolumes();
            this.__meshViewer.removeAllMeshes();

            this.__IRMAnatName.setValue("");

            this.__buttonOpenFunc.setEnabled(false);

            this.__subMenuAnat.hide();

            this.__volumeAnat = undefined;

            this.__buttonCloseAll.setEnabled(false);

            this.contrastSlider.set({value : 0});
            this.brightnessSlider.set({value : 50});


        },

        resetMeshView : function () {
            this.__meshViewer.resetView()
            this.__meshViewer.rotateView(0, -0.5 * Math.PI, 0);
            this.__meshViewer.rotateView(0.75 * Math.PI, 0, 0);
            this.__meshViewer.rotateView(0, 0.1 * Math.PI, 0);
        },

        createSprite : function (text, size, position) {
            if (!size) size = 100;

            var height = 128;

            var canvas = document.createElement('canvas');
            canvas.height = height;


            var context = canvas.getContext("2d");

            context.font = Math.floor(height*0.6) + 'px Helvetica Arial';

            var width = context.measureText(text).width //* height / 10;

            canvas.width = Math.pow(2, Math.ceil(Math.log(width+100) / Math.log(2)));

            var texture = new THREE.Texture(canvas);

            context.clearRect(0, 0, canvas.width, canvas.height);

            context.font = Math.floor(height*0.6) + 'px Helvetica';

            context.fillStyle = "red";
            context.fillText(text, (canvas.width-width)/2, height*0.8);
            texture.needsUpdate = true;

            var material = new THREE.SpriteMaterial({map :texture});
            var mesh = new THREE.Sprite(material);

            mesh.position.copy(position); //.add( new THREE.Vector3(size * width/ height /2, size/2, 0 ) );
            mesh.scale.x = size * canvas.width/ height;
            mesh.scale.y = size;

            return mesh;
        }




    }
});
