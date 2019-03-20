var plotTools = {
	tip:null,//提示框
    info: [],//标绘数据信息源
    Searchinfo: [],//多边形查询
    comPoint: [],//存储单个选中图形的锚点信息
    drawType: null,//记录绘制工具名称
    featureGroup: [],//存放绘制图形要素的图层
    points: [],//点击鼠标绘制过程中记录点集合
    tempLines: [],//临时创建要素存放位置
    PlotTypes: {
        ARC: "arc",
        ELLIPSE: "ellipse",
        CURVE: "curve",
        CLOSED_CURVE: "closedcurve",
        LUNE: "lune",
        SECTOR: "sector",
        GATHERING_PLACE: "gatheringplace",
        STRAIGHT_ARROW: "straightarrow",
        ASSAULT_DIRECTION: "assaultdirection",
        ATTACK_ARROW: "attackarrow",
        TAILED_ATTACK_ARROW: "tailedattackarrow",
        SQUAD_COMBAT: "squadcombat",
        TAILED_SQUAD_COMBAT: "tailedsquadcombat",
        FINE_ARROW: "finearrow",
        CIRCLE: "circle",
        DOUBLE_ARROW: "doublearrow",
        POLYLINE: "polyline",
        FREEHAND_LINE: "freehandline",
        POLYGON: "polygon",
        FREEHAND_POLYGON: "freehandpolygon",
        RECTANGLE: "rectangle",
        MARKER: "marker",
        TRIANGLE: "triangle",
        labelText:"label",
        SEARCHPOLYGON: "searchpolygon"
    },//工具类枚举
    fillstyle: {
        radius: 5,
        color: '#ff122b',
        fillColor: '#0fff43',
        fillOpacity: 0.7
    },//工具默认样式表
    Searchfillstyle: {
        radius: 5,
        color: '#e84ca4',
        fillColor: '#cccbcc',
        fillOpacity: 0.3
    },
    movelayer: null,//选中编辑图层
    pointGroup: [],//选中编辑图层对应锚点存放的点图层
    oldpoint: [],//记录锚点移动时历史位置
    init: function () {
        //注释点地图默认双击事件，防止绘制结束双击时地图缩放
        core.map.off('dblclick');
        //初始化锚点点图层
        plotTools.pointGroup = new L.FeatureGroup();
        core.map.addLayer(plotTools.pointGroup);
        //初始化标绘内容图层
        plotTools.featureGroup = new L.FeatureGroup();
        core.map.addLayer(plotTools.featureGroup);
        //初始化矩形测量图层
        plotTools.rectangleMeasure.layer = L.layerGroup();
        //初始化删除按钮
        plotTools.showdelbtn();
        //标绘图层绑定点击事件
        plotTools.featureGroup.on("click", plotTools.LayerOnClick);
        //设置边框颜色
        $('#colorpalette1').colorPalette().on('selectColor', function(e) {
            $('#plotsborderstyle').css("background",e.color);
            plotTools.fillstyle.color=e.color;
            plotTools. updateStyle();
        });
        //设置填充颜色
        $('#colorpalette2').colorPalette().on('selectColor', function(e) {
            $('#plotsfillstyle').css("background",e.color);
            plotTools.fillstyle.fillColor=e.color;
            plotTools. updateStyle();
        });
        //设置字体颜色
        $('#colorpalette3').colorPalette().on('selectColor', function(e) {
            $('#plotsfontstyle').css("background",e.color);
            plotTools.label.fontColor=e.color;
            if(plotTools.movelayer!=null&& plotTools.movelayer.hasOwnProperty('options')){
                if( plotTools.movelayer.options.name== plotTools.PlotTypes.labelText){
                    plotTools. updateStyle();
                }
            }

        });
        //字体大小
        $("#plotsfontsize").change(function(){
            var checkValue=$("#plotsfontsize").find("option:selected").text();
            plotTools.label.fontSize=checkValue;
            if(plotTools.movelayer!=null&& plotTools.movelayer.hasOwnProperty('options')){
                if( plotTools.movelayer.options.name== plotTools.PlotTypes.labelText){
                    plotTools. updateStyle();
                }
            }
        });

        //添加滚轮事件，
        core.map.on("zoomend", plotTools.LayerWheel);
        //由三围返回二维，显示原来标绘内容
        if(plotTools.info.length>0 || plotTools.Searchinfo.length>0  ) {
            plotTools.reviewPlots();
        }

    },
    //点击图层事件
    LayerOnClick: function (e) {
        //点击文本要素时，修改样式添加选中状态
        if(plotTools.movelayer!=null&& plotTools.movelayer.hasOwnProperty('options')){
            if( plotTools.movelayer.options.name== plotTools.PlotTypes.labelText)
            plotTools.label.setStyle(false,plotTools.movelayer);
        }
        core.map.on('dblclick', plotTools.onDoubleClick);//绑定双击事件
        plotTools.pointGroup.clearLayers();//清空锚点图层
        var _layer = e.layer || e.target;//获取选中要素信息
        if (_layer != null || _layer != undefined) {
            if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0 && _layer.options.id==plotTools.Searchinfo[0].id) {
                var value=plotTools.Searchinfo[0];
                plotTools.showPoint(value.points, value.id, value.name,"!txt");
                $("#plotTools_deletebtn").show();
                plotTools.movelayer = _layer;
                plotTools.movelayer.options.name = value.name;
            }
            else {
                //从标绘数据源中查找选中信息
                plotTools.info.forEach(function (value, index) {
                    if (value.id == _layer.options.id) {
                        plotTools.label.setStyle(true, _layer);//点击如果是文本要素时，修改样式添加选中状态
                        if (value.name != plotTools.PlotTypes.labelText)
                            //非文本要素显示锚点
                            plotTools.showPoint(value.points, value.id, value.name, "!txt");
                        else {
                            //锚点要素显示锚点
                            var lanlng = {"lat": value.points[0][0], "lng": value.points[0][1]};//文字标绘中心点
                            var point2 = plotTools.getRegPoint(lanlng, value.width.replace("px", ""), value.height.replace("px", ""));//有宽高求对角坐标
                            value.points = [value.points[0]].concat(point2);//更新本文数据源对角坐标坐标
                            plotTools.showPoint(value.points, value.id, value.name, "txt");
                        }
                    }
                    $("#plotTools_deletebtn").show();
                    plotTools.movelayer = _layer;
                    plotTools.movelayer.options.name = value.name;
                });

            }


        }
        //选择标绘图层是联动样式设置工具
        if(_layer.options.name!=plotTools.PlotTypes.SEARCHPOLYGON) {
            if (_layer.hasOwnProperty("options") && _layer.options.name == plotTools.PlotTypes.labelText
                && _layer.options.hasOwnProperty("fontSize") && _layer.options.hasOwnProperty("fontColor")) {
                $("#plotsfontsize").val(_layer.options.fontSize.replace("px", ""));
                plotTools.label.fontSize = _layer.options.fontSize;
                $('#plotsfontstyle').css("background", _layer.options.fontColor);
                plotTools.label.fontColor = _layer.options.fontColor;
            }
            if (_layer.hasOwnProperty("options") && _layer.options.name != plotTools.PlotTypes.labelText
                && _layer.options.hasOwnProperty("color") && _layer.options.hasOwnProperty("fillColor")
                && _layer.options.color != undefined && _layer.options.fillColor != undefined) {
                $('#plotsborderstyle').css("background", _layer.options.color);
                plotTools.fillstyle.color = _layer.options.color;
                $('#plotsfillstyle').css("background", _layer.options.fillColor);
                plotTools.fillstyle.fillColor = _layer.options.fillColor;
            }
        }
    },
    showdelbtn: function () {
        var btn = $("<input type='button' style='position: absolute;top: 2px;border: 0px; left:48%;width: 45px;height: 30px;background-color:#b2ffff; z-index: 500;' id='plotTools_deletebtn' value='删除'/>");
        $("#map").append(btn);
        //绑定删除事件
        $("#plotTools_deletebtn").bind("click", function () {
            plotTools.featureGroup.removeLayer(plotTools.movelayer);
            plotTools.delete(plotTools.movelayer.options.id);
            plotTools.pointGroup.clearLayers();
            $("#plotTools_deletebtn").hide();
            plotTools.movelayer=[];
        });
        $("#plotTools_deletebtn").hide();
    },
    //点击事件
    onClick: function (e) {
        if (plotTools.points.length > 0 && plotTools.points[plotTools.points.length - 1][0] == e.latlng.lat && plotTools.points[plotTools.points.length - 1][1] == e.latlng.lng){
            return;
        }
        //记录点击位置，用于绘制标绘图层
        plotTools.points.push([e.latlng.lat, e.latlng.lng]);
        $("#plotTools_deletebtn").hide();
        plotTools.pointGroup.clearLayers();

    },
    //双击事件
    onDoubleClick: function () {
        //查询多边形
        //if(plotTools.movelayer!=null && plotTools.movelayer.options.name==plotTools.PlotTypes.SEARCHPOLYGON && plotTools.tempLines!=null){

        if((plotTools.drawType!=null && plotTools.drawType==plotTools.PlotTypes.SEARCHPOLYGON && plotTools.tempLines!=null) || (plotTools.movelayer!=null && plotTools.movelayer.options!=undefined && plotTools.movelayer.options.name==plotTools.PlotTypes.SEARCHPOLYGON && plotTools.tempLines!=null) ){
            plotTools.onSearchDoubleClick();
        }else {
            //文字标注
            if (plotTools.drawType == plotTools.PlotTypes.labelText && plotTools.tempLines != null) {
                plotTools.label.createLy(plotTools.tempLines);
            }
            //非文字标注
            if (plotTools.points.length > 0 && plotTools.drawType != plotTools.PlotTypes.labelText) {
                plotTools.info.push({
                    'id': plotTools.tempLines.options.id,
                    'name': plotTools.drawType,
                    'points': plotTools.comPoint,
                    'borderCol': plotTools.fillstyle.color,
                    'fillCol': plotTools.fillstyle.fillColor,
                    'fontCol': plotTools.label.fontColor,
                    'fontSize': plotTools.label.fontSize,
                });
            }
            //文本编辑后，更新数据源文本信息
            if (plotTools.movelayer != null && plotTools.movelayer.hasOwnProperty('options')) {
                if (plotTools.movelayer.options.name == plotTools.PlotTypes.labelText&&plotTools.movelayer._icon) {
                    var content = $("#" + plotTools.movelayer._icon.children[0].id).val();
                    if(plotTools.movelayer._icon){
                        var content = $("#" + plotTools.movelayer._icon.children[0].id).val();
                        plotTools.info.forEach(function (value) {
                            if (value.id == plotTools.movelayer._icon.children[0].id) {
                                value["content"] = content;
                            }
                        });
                    }
                    plotTools.label.setStyle(false, plotTools.movelayer);
                }
            }
        }
        plotTools.movelayer=[];
        plotTools.points = [];
        plotTools.drawType = null;
        plotTools.comPoint = [];
        plotTools.pointGroup.clearLayers();
        $("#plotTools_deletebtn").hide();
        plotTools.tempLines = [];
        core.map.off('click', plotTools.onClick).off('mousemove', plotTools.onMove).off('dblclick', plotTools.onDoubleClick);

		plotTools.closeTips();
    },
    onSearchDoubleClick: function () {
        //非文字标注
        if (plotTools.points.length > 0 ) {
            //删除原有标绘多边形
                if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0 && plotTools.featureGroup!=[] && plotTools.featureGroup._layers!=undefined){
                    for(var layer in plotTools.featureGroup._layers){
                        var searchLayer=plotTools.featureGroup._layers[layer];
                        if(searchLayer.options.id==plotTools.Searchinfo[0].id){
                            plotTools.featureGroup.removeLayer(searchLayer);
                            break;
                        }

                    }
                }
            plotTools.Searchinfo=[];
            plotTools.Searchinfo.push({
                'id': plotTools.tempLines.options.id,
                'name': plotTools.drawType,
                'points': plotTools.comPoint,
                'borderCol': plotTools.fillstyle.color,
                'fillCol': plotTools.fillstyle.fillColor,
                'fontCol': plotTools.label.fontColor,
                'fontSize': plotTools.label.fontSize,
            });

        }
        if(plotTools.Searchinfo!=null&& plotTools.Searchinfo.length>0 && plotTools.Searchinfo[0].points.length>0){
            L.dh.public.polygonSearch(true);
        }

    },
    //鼠标移动事件
    onMove: function (e) {
        if (plotTools.points.length < 1){
            return;
        }
        if (plotTools.points[plotTools.points.length - 1][0] == e.latlng.lat && plotTools.points[plotTools.points.length - 1][1] == e.latlng.lng) {
            return;
        }
        if (plotTools.drawType != undefined || plotTools.drawType != null) {
            plotTools.featureGroup.removeLayer(plotTools.tempLines);
            switch (plotTools.drawType) {
                case plotTools.PlotTypes.FINE_ARROW:
                    var ls = [plotTools.points[plotTools.points.length - 1], [e.latlng.lat, e.latlng.lng]];
                    plotTools.drawingPolygon(plotTools.Plot_FineArrow(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.SQUAD_COMBAT:
                    var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingPolygon(plotTools.Plot_SquadCombat(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.TAILED_SQUAD_COMBAT:
                    var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingPolygon(plotTools.Plot_TailedSquadCombat(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.ASSAULT_DIRECTION:
                    var ls = [plotTools.points[plotTools.points.length - 1], [e.latlng.lat, e.latlng.lng]];
                    plotTools.drawingPolygon(plotTools.Plot_AssaultDirection(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.STRAIGHT_ARROW:
                    var ls = [plotTools.points[plotTools.points.length - 1], [e.latlng.lat, e.latlng.lng]];
                    plotTools.drawingLine(plotTools.Plot_StraightArrow(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.MARKER:
                    plotTools.tempLines = L.circleMarker([e.latlng.lat, e.latlng.lng], plotTools.fillstyle);
                    plotTools.tempLines.options.id = plotTools.uuid();
                    plotTools.featureGroup.addLayer(plotTools.tempLines);
                    plotTools.comPoint = [[e.latlng.lat, e.latlng.lng]];
                    break;
                case plotTools.PlotTypes.CURVE:
                    var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingLine(plotTools.Plot_Curve(ls));
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.POLYLINE:
                    var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingLine(ls);
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.FREEHAND_LINE:
                    plotTools.points.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingLine(plotTools.points);
                    plotTools.comPoint = plotTools.points;
                    break;
                case plotTools.PlotTypes.POLYGON:
                    var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingPolygon(ls);
                    plotTools.comPoint = ls;
                    break;
                case plotTools.PlotTypes.FREEHAND_POLYGON:
                    plotTools.points.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingPolygon(plotTools.points);
                    plotTools.comPoint = plotTools.points.slice(0);
                    break;
                case  plotTools.PlotTypes.labelText:
                    var _point=[plotTools.points[0],[e.latlng.lat, e.latlng.lng]];
                    plotTools.tempLines = L.rectangle(_point, {color: plotTools.rectangleMeasure.color, weight: 1});
                    plotTools.tempLines.options.id = plotTools.uuid();
                    plotTools.tempLines.options.fontCol=plotTools.label.fontColor;
                    plotTools.tempLines.options.fontSize=plotTools.label.fontSize;
                    plotTools.featureGroup.addLayer(plotTools.tempLines);
                    plotTools.comPoint =[plotTools.points[0],[e.latlng.lat, e.latlng.lng]];
                    break;
                case plotTools.PlotTypes.SEARCHPOLYGON:
                    /*var ls = plotTools.points.slice(0);
                    ls.push([e.latlng.lat, e.latlng.lng]);
                    plotTools.drawingSearchPolygon(ls);
                    plotTools.comPoint = ls;*/
                    var _point=[plotTools.points[0],[e.latlng.lat, e.latlng.lng]];
                    plotTools.tempLines = L.rectangle(_point,plotTools.Searchfillstyle);
                    plotTools.tempLines.options.id = plotTools.uuid();
                    plotTools.featureGroup.addLayer(plotTools.tempLines);
                    plotTools.comPoint =[plotTools.points[0],[e.latlng.lat, e.latlng.lng]];
                    break;
            }
        }
    },
    //添加点
    AddPoint: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.MARKER;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);
    },
    //画曲线
    Curve: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.CURVE;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //画折线
    Polyline: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.POLYLINE;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //画自由线
    FreeHandLine: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.FREEHAND_LINE;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //绘制多边形
    Polygon: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.POLYGON;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //绘制自由面
    FreeHandPolygon: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.FREEHAND_POLYGON;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //直箭头
    StraightArrow: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.STRAIGHT_ARROW;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //细直箭头
    FineArrow: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.FINE_ARROW;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //突击方向
    AssaultDirection: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.ASSAULT_DIRECTION;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },

    //分队战斗方向
    SquadCombat: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.SQUAD_COMBAT;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },

    //分队战斗行动（尾）
    TailedSquadCombat: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.TAILED_SQUAD_COMBAT;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },
    //面积量测
    Area: function () {
		plotTools.showTips();
        core.map.off('mousedown', plotTools.LineMeasure.mousedown);
        core.map.on('mousedown', plotTools.rectangleMeasure.mousedown).on('dblclick', plotTools.rectangleMeasure.onDoubleClick);
    },
    //距离量测
    Horizontal: function () {
		plotTools.showTips();
        core.map.off('mousedown', plotTools.rectangleMeasure.mousedown).off('dblclick', plotTools.rectangleMeasure.onDoubleClick);
        core.map.on('mousedown', plotTools.LineMeasure.mousedown);
    },
    //文字标绘工具按钮
    AddText: function () {
		plotTools.showTips();
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.labelText;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);
    },
    //展示点
    showPoint: function (pts, id, name,isTxt) {
        if (pts.length > 0)
            pts.forEach(function (v, i) {
                if(isTxt=="txt"){
                    //文本锚点需要使用mark作为锚点
                    var ply =  L.marker(v, {icon: plotTools.label.IconPoint,zIndexOffset:1000});
                    plotTools.pointGroup.addLayer(ply);
                }else {
                    //非文本使用普通点作为锚点
                    var ply = L.circleMarker(v, {color: '#fffafe', radius: 5, fillColor: '#ff122b'});
                    plotTools.pointGroup.addLayer(ply);
                }
                //添加锚点图层属性信息
                plotTools.pointGroup.options.txt=isTxt;
                plotTools.pointGroup.options.id = id;
                plotTools.pointGroup.options.name = name;
                ply.on("mousedown", plotTools.selectPoint);
            });
    },
	showTips: function(){
		$("#tips")[0].style.display = "block";
	},
	closeTips: function(){
		$("#tips")[0].style.display = "none";
	},
    selectPoint: function (e) {
        //存储移动前锚点坐标
        plotTools.oldpoint = [e.target._latlng.lat, e.target._latlng.lng];
        plotTools.pointGroup.removeLayer(e.target);
        //将地图默认移动属性关闭
        core.map.dragging.disable();
        core.map.on("mouseup", plotTools.upPoint);
        if($("textarea").length>0){
              $("textarea").attr("readonly","readonly");
          }
    },
    upPoint: function (e) {
        if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0 && plotTools.pointGroup.options.id==plotTools.Searchinfo[0].id){
            var value=plotTools.Searchinfo[0];
            for (var k = 0; k < value.points.length; k++) {
                if (plotTools.oldpoint.toString() == value.points[k].toString()) {
                    value.points[k] = [e.latlng.lat, e.latlng.lng].slice(0);
                    break;
                }
            }
            plotTools.createPolt([{
                "id": plotTools.pointGroup.options.id,
                "name": plotTools.pointGroup.options.name,
                "points": value.points,
                'borderCol': value.borderCol,
                'fillCol': value.fillCol,
            }]);
            plotTools.tempLines = [];
            plotTools.pointGroup.clearLayers();
            plotTools.showPoint(value.points, plotTools.pointGroup.options.id, plotTools.pointGroup.options.name, plotTools.pointGroup.options.txt);

        }else {
            //修改编辑图层相对应的位置信息
            plotTools.info.forEach(function (value) {
                if (value.id == plotTools.pointGroup.options.id) {
                    var count = 0;//记录图形移动点序号,获取移动图形锚点序号，0为中心点坐标，1和2为对角坐标
                    for (var k = 0; k < value.points.length; k++) {
                        if (plotTools.oldpoint.toString() == value.points[k].toString()) {
                            //新的锚点坐标替换原锚点坐标
                            value.points[k] = [e.latlng.lat, e.latlng.lng].slice(0);
                            count = k;//记录图形移动点序号
                            break;
                        }
                    }
                    //文本图层锚点
                    if (plotTools.pointGroup.options.txt == "txt") {
                        if (count == 0) {//修改文本中心点
                            //根据新的文本中心点、文本框宽高，求出新的对角坐标并更新数据源
                            value.points = [value.points[0]].concat(plotTools.getRegPoint(e.latlng, value.width.replace("px", ""), value.height.replace("px", "")));
                            plotTools.label.layer = plotTools.movelayer;
                            //更新文本中心点位置，并显示
                            plotTools.label.updateCenter(value.points[0]);
                        } else {
                            //移动对角点，根据新对角点计算中心点位置
                            plotTools.tempLines = L.rectangle([value.points[1], value.points[2]], {
                                color: plotTools.rectangleMeasure.color,
                                weight: 1
                            });
                            var latlngs = plotTools.tempLines.getLatLngs();//矩形角点坐标组
                            var _center = new L.LatLngBounds(latlngs).getCenter();  //中心点
                            var corner = latlngs[0][1];//第一个对对角点
                            var oppositeCorner = latlngs[0][3];//第三个对角点
                            var cornerPixelCoordinates = core.map.latLngToLayerPoint(corner).round();
                            var oppositeCornerPixelCoordinates = core.map.latLngToLayerPoint(oppositeCorner).round();
                            var width = oppositeCornerPixelCoordinates.x - cornerPixelCoordinates.x + 2;//新矩形宽
                            var height = oppositeCornerPixelCoordinates.y - cornerPixelCoordinates.y + 2;//新矩形高
                            //跟新数据源
                            value.width = width + "px";
                            value.height = height + "px";
                            value.points[0] = [_center.lat, _center.lng];
                            value.content = $("#" + plotTools.pointGroup.options.id).val();
                            //重新绘制文本标绘内容
                            plotTools.createPolt([value]);
                            //绘制后选中保持状态
                            plotTools.label.setStyle(true, plotTools.movelayer);
                        }
                    } else {
                        //非文本图层锚点，根据新锚点绘制标绘图形
                        plotTools.createPolt([{
                            "id": plotTools.pointGroup.options.id,
                            "name": plotTools.pointGroup.options.name,
                            "points": value.points,
                            'borderCol': value.borderCol,
                            'fillCol': value.fillCol,
                        }]);
                    }
                    //清除历史记录
                    plotTools.tempLines = [];
                    plotTools.pointGroup.clearLayers();
                    //显示新锚点位置
                    plotTools.showPoint(value.points, plotTools.pointGroup.options.id, plotTools.pointGroup.options.name, plotTools.pointGroup.options.txt);
                }
            });
        }

        if($("textarea").length>0){
            $("textarea").removeAttr("readonly");
        }
        //释放地图漫游功能
        core.map.dragging.enable();
        //关闭点击事件
        core.map.off("mouseup", plotTools.upPoint);
    },
     //离开应急事件时关闭绘制内容
    destroy: function () {
        plotTools.points = [];
        plotTools.drawType = null;
        plotTools.comPoint = [];
        plotTools.info=[];
        plotTools.featureGroup.clearLayers();
        plotTools.pointGroup.clearLayers();
        if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0){
            plotTools.Searchinfo=[];
            L.dh.public.polygonSearch(false);
        }
        $("#plotTools_deletebtn").hide();
        plotTools.tempLines = [];
        core.map.off('click', plotTools.onClick).off('mousemove', plotTools.onMove).off('dblclick', plotTools.onDoubleClick);
        if(L.dh.public.checkMapType()=="3D"){
            sgTool.Create3D.deleteAllSource();//三维界面清除三维图层信息
        }
    },
    //滚轮事件
    LayerWheel:function () {
            if( plotTools.info.length==0)return;
            //清空图层锚点信息
            if (plotTools.movelayer!=null){
                $("#plotTools_deletebtn").hide();
                plotTools.pointGroup.clearLayers();
                plotTools.movelayer=[];
            }
    },

    //加载样式
    AddStyle:function (value) {
        if(value.hasOwnProperty("borderCol")&&value.borderCol!=undefined)
        plotTools.fillstyle.color=value.borderCol;//根据数据源设置工具箱边框颜色
        if(value.hasOwnProperty("fillCol")&&value.fillCol!=undefined)
        plotTools.fillstyle.fillColor=value.fillCol;//填充颜色
        if(value.hasOwnProperty("fontCol")&&value.fontCol!=undefined)
        plotTools.label.fontColor=value.fontCol;//字体颜色
        if(value.hasOwnProperty("fontSize")&&value.fontSize!=undefined)
        plotTools.label.fontSize=value.fontSize;//字体大小
    },

    //工具箱样式改变时，修改选中图层样式
    updateStyle:function () {
        if(plotTools.movelayer!=null&& plotTools.movelayer.hasOwnProperty('options')){
            plotTools.info.forEach(function (value) {
                if (value.id == plotTools.movelayer.options.id) {
                    //如果选中图层为文本标签
                    if(plotTools.movelayer.hasOwnProperty("options")&& plotTools.movelayer.options.name==plotTools.PlotTypes.labelText){
                        value.fontCol=plotTools.label.fontColor;
                        value.fontSize=plotTools.label.fontSize;
                        value.content=$("#"+  plotTools.pointGroup.options.id).val();
                        plotTools.label.setStyle(true,plotTools.movelayer);
                    }else {
                        //非文本标签
                        value.borderCol=plotTools.fillstyle.color;
                        value.fillCol=plotTools.fillstyle.fillColor;
                    }
                    plotTools.featureGroup.removeLayer(plotTools.movelayer);
                    plotTools.createPolt([value]);//跟新样式
                }
            });
            plotTools.tempLines = [];
        }
    },

    //返回二维地图时显示标绘内容
    reviewPlots:function () {
        //由于三维回到二维，有两次定位设置，所以需要在定位完成后加载文本标签。否则对角点计算出来的位置有错误，暂时使用定时器解决
        setTimeout(function (args) {
            //根据标绘数据源创建标绘内容
            plotTools.createPolt(plotTools.info);
            plotTools.tempLines=[];
            plotTools.movelayer=[];
            plotTools.createPolt(plotTools.Searchinfo);
            plotTools.tempLines=[];
            plotTools.movelayer=[];
        },2000);
    },

    //绘制多边形查询框
    searchPolygon: function () {
        plotTools.points = [];
        plotTools.drawType = plotTools.PlotTypes.SEARCHPOLYGON;
        core.map.on('click', plotTools.onClick).on('mousemove', plotTools.onMove).on('dblclick', plotTools.onDoubleClick);

    },

    //取消多边形查询
    cancleSearchPolygon:function () {
        //删除原有标绘多边形
        if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0 && plotTools.featureGroup!=[] && plotTools.featureGroup._layers!=undefined){
            for(var layer in plotTools.featureGroup._layers){
                var searchLayer=plotTools.featureGroup._layers[layer];
                if(searchLayer.options.id==plotTools.Searchinfo[0].id){
                    console.log("Searchinfo Delete");
                    plotTools.featureGroup.removeLayer(searchLayer);
                    plotTools.delete(searchLayer.options.id);
                    plotTools.pointGroup.clearLayers();
                    $("#plotTools_deletebtn").hide();
                    plotTools.movelayer=[];
                    plotTools.Searchinfo=[];
                    break;
                }

            }
        }

    }

};
plotTools.P = {
    HALF_PI: Math.PI / 2,
    headAngle: Math.PI / 8.5,
    neckAngle: Math.PI / 13,
    tailWidthFactor: .1,
    headHeightFactor: .18,
    headTailFactor: .8,
    headWidthFactor: .3,
    neckWidthFactor: .15,
    neckHeightFactor: .85,
    TWO_PI: 2 * Math.PI,
    connPoint: null,
    tempPoint4: null,
    swallowTailFactor: 1,
    ZERO_TOLERANCE: 1e-4,
    FITTING_COUNT: 100

};
//绘制曲线
plotTools.Plot_Curve = function (pt_array) {
    var t = pt_array.length;
    var _pt = plotTools.transformPoint(pt_array);
    var _pts = [];
    2 > t || (2 == t ? _pts = plotTools.transformPoint(pt_array) : _pts = plotTools.getCurvePoints(.3, _pt));
    return plotTools.transformlatlg(_pts);
};

//直箭头
plotTools.Plot_StraightArrow = function (pt_array) {
    if (!(pt_array.length < 2)) {
        var t = plotTools.transformPoint(pt_array), o = t[0], e = t[1], r = plotTools.distance(o, e), n = r / 5;
        n = n > 3e6 ? 3e6 : n;
        var g = plotTools.getThirdPoint(o, e, Math.PI / 6, n, !1),
            i = plotTools.getThirdPoint(o, e, Math.PI / 6, n, !0);
        return plotTools.transformlatlg([o, e, g, e, i]);
    }
};

//细直箭头
plotTools.Plot_FineArrow = function (pt_array) {
    var t = pt_array.length;
    if (!(2 > t)) {
        var o = pt_array, e = plotTools.ToPoint(o[0]), r = plotTools.ToPoint(o[1]), n = plotTools.getBaseLength([e, r]),
            g = n * .15,
            i = n * .2, s = n * .25,
            a = plotTools.getThirdPoint(r, e, plotTools.P.HALF_PI, g, !0),
            l = plotTools.getThirdPoint(r, e, plotTools.P.HALF_PI, g, !1),
            u = plotTools.getThirdPoint(e, r, plotTools.P.headAngle, s, !1),
            c = plotTools.getThirdPoint(e, r, plotTools.P.headAngle, s, !0),
            p = plotTools.getThirdPoint(e, r, plotTools.P.neckAngle, i, !1),
            h = plotTools.getThirdPoint(e, r, plotTools.P.neckAngle, i, !0);
        return plotTools.transformlatlg([a, p, u, r, c, h, l]);
    }
};

//分队战斗行动
plotTools.Plot_SquadCombat = function (pt_array) {
    var t = pt_array.length;
    if (!(2 > t)) {
        var o = plotTools.transformPoint(pt_array), e = plotTools.getTailPoints(o),
            r = plotTools.getArrowHeadPoints(o, e[0], e[1]), n = r[0],
            g = r[4], i = plotTools.getArrowBodyPoints(o, n, g, plotTools.P.tailWidthFactor), t = i.length,
            s = [e[0]].concat(i.slice(0, t / 2));
        s.push(n);
        var a = [e[1]].concat(i.slice(t / 2, t));
        a.push(g), s = plotTools.getQBSplinePoints(s), a = plotTools.getQBSplinePoints(a);
        return plotTools.transformlatlg(s.concat(r, a.reverse()));
    }
};

//分队战斗行动（尾）
plotTools.Plot_TailedSquadCombat = function (pt_array) {
    var t = pt_array.length;
    if (!(2 > t)) {
        var o = plotTools.transformPoint(pt_array), e = plotTools.TailedSquadCombat.getTailPoints(o),
            r = plotTools.getArrowHeadPoints(o, e[0], e[2]), n = r[0],
            g = r[4], i = plotTools.getArrowBodyPoints(o, n, g, plotTools.P.tailWidthFactor), t = i.length,
            s = [e[0]].concat(i.slice(0, t / 2));
        s.push(n);
        var a = [e[2]].concat(i.slice(t / 2, t));
        a.push(g), s = plotTools.getQBSplinePoints(s), a = plotTools.getQBSplinePoints(a);
        return plotTools.transformlatlg(s.concat(r, a.reverse(), [e[1], s[0]]));
    }
};

//突击方向
plotTools.Plot_AssaultDirection = function (pt_array) {
    var t = pt_array.length;
    if (!(2 > t)) {
        var o = pt_array, e = plotTools.ToPoint(o[0]), r = plotTools.ToPoint(o[1]), n = plotTools.getBaseLength([e, r]),
            g = n * .2,
            i = n * .25, s = n * .3,
            a = plotTools.getThirdPoint(r, e, plotTools.P.HALF_PI, g, !0),
            l = plotTools.getThirdPoint(r, e, plotTools.P.HALF_PI, g, !1),
            u = plotTools.getThirdPoint(e, r, Math.PI / 4, s, !1),
            c = plotTools.getThirdPoint(e, r, Math.PI / 4, s, !0),
            p = plotTools.getThirdPoint(e, r, .17741 * Math.PI, i, !1),
            h = plotTools.getThirdPoint(e, r, .17741 * Math.PI, i, !0);
        return plotTools.transformlatlg([a, p, u, r, c, h, l]);
    }
};

//根据点数组绘制多边形图形
plotTools.drawingPolygon = function (s) {
    plotTools.tempLines = L.polygon([s], plotTools.fillstyle);
    plotTools.tempLines.options.id = plotTools.uuid();
    plotTools.featureGroup.addLayer(plotTools.tempLines);
};

//根据点绘制线图形
plotTools.drawingLine = function (s) {
    plotTools.tempLines = L.polyline([s], plotTools.fillstyle);
    plotTools.tempLines.options.id = plotTools.uuid();
    plotTools.featureGroup.addLayer(plotTools.tempLines);
};

//根据点数组重新绘制多边形图形
plotTools.redrawPolygon = function (s, uuid) {
    plotTools.tempLines = L.polygon([s], plotTools.fillstyle);
    plotTools.tempLines.options.id = uuid;
    plotTools.featureGroup.addLayer(plotTools.tempLines);
    plotTools.movelayer = plotTools.tempLines;
};


//根据点数组绘制查询多边形图形
plotTools.drawingSearchPolygon = function (s) {
    plotTools.tempLines = L.polygon([s], plotTools.Searchfillstyle);
    plotTools.tempLines.options.id = plotTools.uuid();
    plotTools.featureGroup.addLayer(plotTools.tempLines);
};

//根据点数组重新绘制查询多边形图形
plotTools.redrawSearchPolygon = function (s, uuid) {
    /*plotTools.tempLines = L.polygon([s], plotTools.Searchfillstyle);
    plotTools.tempLines.options.name= plotTools.PlotTypes.SEARCHPOLYGON;
    plotTools.tempLines.options.id = uuid;
    plotTools.featureGroup.addLayer(plotTools.tempLines);
    plotTools.movelayer = plotTools.tempLines;*/
    console.log(s);
    plotTools.tempLines = L.rectangle([s],  plotTools.Searchfillstyle);
    plotTools.tempLines.options.id =uuid;
    plotTools.featureGroup.addLayer(plotTools.tempLines);
    plotTools.movelayer = plotTools.tempLines;
};


//根据点重新绘制线图形
plotTools.redrawLine = function (s, uuid) {
    plotTools.tempLines = L.polyline([s], plotTools.fillstyle);
    plotTools.tempLines.options.id = uuid;
    plotTools.featureGroup.addLayer(plotTools.tempLines);
    plotTools.movelayer = plotTools.tempLines;
};

plotTools.distance = function (t, o) {
    return Math.sqrt(Math.pow(t[0] - o[0], 2) + Math.pow(t[1] - o[1], 2))
};

plotTools.getThirdPoint = function (t, o, e, r, n) {
    var g = plotTools.getAzimuth(t, o), i = n ? g + e : g - e, s = r * Math.cos(i), a = r * Math.sin(i);
    return [o[0] + s, o[1] + a]
};

plotTools.getAzimuth = function (t, o) {
    var e, r = Math.asin(Math.abs(o[1] - t[1]) / plotTools.distance(t, o));
    return o[1] >= t[1] && o[0] >= t[0] ? e = r + Math.PI : o[1] >= t[1] && o[0] < t[0] ? e = 2 * Math.PI - r : o[1] < t[1] && o[0] < t[0] ? e = r : o[1] < t[1] && o[0] >= t[0] && (e = Math.PI - r), e
};

plotTools.getBaseLength = function (t) {
    return Math.pow(plotTools.wholedistance(t), .99)
};

plotTools.wholedistance = function (t) {
    for (var o = 0, e = 0; e < t.length - 1; e++) o += plotTools.distance(t[e], t[e + 1]);
    return o
};

plotTools.ToPoint = function (t) {
    var point_old = L.latLng(t[0], t[1]);
    var point_new = L.CRS.EPSG3857.project(point_old);
    return [point_new.x, point_new.y];
};

plotTools.ToCRS = function (p) {
    var t = L.CRS.EPSG3857.unproject(L.point(p[0], p[1]));
    return t;
};

plotTools.getTailPoints = function (t) {
    var o = plotTools.getBaseLength(t), e = o * plotTools.P.tailWidthFactor,
        r = plotTools.getThirdPoint(t[1], t[0], plotTools.P.HALF_PI, e, !1),
        n = plotTools.getThirdPoint(t[1], t[0], plotTools.P.HALF_PI, e, !0);
    return [r, n]
};

plotTools.getArrowHeadPoints = function (t, o, e) {
    var r = plotTools.getBaseLength(t), n = r * plotTools.P.headHeightFactor, g = t[t.length - 1];
    r = plotTools.distance(g, t[t.length - 2]);
    var i = plotTools.distance(o, e);
    n > i * plotTools.P.headTailFactor && (n = i * plotTools.P.headTailFactor);
    var s = n * plotTools.P.headWidthFactor, a = n * plotTools.P.neckWidthFactor;
    n = n > r ? r : n;
    var l = n * plotTools.P.neckHeightFactor,
        u = plotTools.getThirdPoint(t[t.length - 2], g, 0, n, !0),
        c = plotTools.getThirdPoint(t[t.length - 2], g, 0, l, !0),
        p = plotTools.getThirdPoint(g, u, plotTools.P.HALF_PI, s, !1),
        h = plotTools.getThirdPoint(g, u, plotTools.P.HALF_PI, s, !0),
        d = plotTools.getThirdPoint(g, c, plotTools.P.HALF_PI, a, !1),
        f = plotTools.getThirdPoint(g, c, plotTools.P.HALF_PI, a, !0);
    return [d, p, g, h, f]
};

plotTools.transformPoint = function (t) {
    var points = [];
    t.forEach(function (ele, index) {
        points.push(plotTools.ToPoint(ele))
    });
    return points;
};

plotTools.getArrowBodyPoints = function (t, o, e, r) {
    for (var n = plotTools.wholedistance(t), g = plotTools.getBaseLength(t), i = g * r, s = plotTools.distance(o, e), a = (i - s) / 2, l = 0, u = [], c = [], p = 1; p < t.length - 1; p++) {
        var h = plotTools.getAngleOfThreePoints(t[p - 1], t[p], t[p + 1]) / 2;
        l += plotTools.distance(t[p - 1], t[p]);
        var d = (i / 2 - l / n * a) / Math.sin(h), f = plotTools.getThirdPoint(t[p - 1], t[p], Math.PI - h, d, !0),
            E = plotTools.getThirdPoint(t[p - 1], t[p], h, d, !1);
        u.push(f), c.push(E)
    }
    return u.concat(c)
};

plotTools.getAngleOfThreePoints = function (t, o, e) {
    var r = plotTools.getAzimuth(o, t) - plotTools.getAzimuth(o, e);
    return 0 > r ? r + plotTools.P.TWO_PI : r
};

plotTools.getQBSplinePoints = function (t) {
    if (t.length <= 2) return t;
    var o = 2, e = [], r = t.length - o - 1;
    e.push(t[0]);
    for (var n = 0; r >= n; n++) for (var g = 0; 1 >= g; g += .05) {
        for (var i = y = 0, s = 0; o >= s; s++) {
            var a = plotTools.getQuadricBSplineFactor(s, g);
            i += a * t[n + s][0], y += a * t[n + s][1]
        }
        e.push([i, y])
    }
    return e.push(t[t.length - 1]), e
};

plotTools.getQuadricBSplineFactor = function (t, o) {
    return 0 == t ? Math.pow(o - 1, 2) / 2 : 1 == t ? (-2 * Math.pow(o, 2) + 2 * o + 1) / 2 : 2 == t ? Math.pow(o, 2) / 2 : 0
};

plotTools.transformlatlg = function (t) {
    var pts = [];
    t.forEach(function (e, i) {
        pts.push([plotTools.ToCRS(e).lat, plotTools.ToCRS(e).lng]);
    })
    return pts;
};

plotTools.getTempPoint4 = function (t, o, e) {
    var r, n, g, i, s = plotTools.mid(t, o), a = plotTools.distance(s, e),
        l = plotTools.getAngleOfThreePoints(t, s, e);
    return l < plotTools.P.HALF_PI ? (n = a * Math.sin(l), g = a * Math.cos(l), i = plotTools.getThirdPoint(t, s, plotTools.P.HALF_PI, n, !1),
        r = plotTools.getThirdPoint(s, i, plotTools.P.HALF_PI, g, !0)) : l >= plotTools.P.HALF_PI && l < Math.PI ? (n = a * Math.sin(Math.PI - l),
        g = a * Math.cos(Math.PI - l), i = plotTools.getThirdPoint(t, s, plotTools.P.HALF_PI, n, !1),
        r = plotTools.getThirdPoint(s, i, plotTools.P.HALF_PI, g, !1)) : l >= Math.PI && l < 1.5 * Math.PI ? (n = a * Math.sin(l - Math.PI),
        g = a * Math.cos(l - Math.PI), i = plotTools.getThirdPoint(t, s, plotTools.P.HALF_PI, n, !0),
        r = plotTools.getThirdPoint(s, i, plotTools.P.HALF_PI, g, !0)) : (n = a * Math.sin(2 * Math.PI - l),
        g = a * Math.cos(2 * Math.PI - l), i = plotTools.getThirdPoint(t, s, plotTools.P.HALF_PI, n, !0), r = plotTools.getThirdPoint(s, i, plotTools.P.HALF_PI, g, !1)), r
};

plotTools.mid = function (t, o) {
    return [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2]
};

plotTools.isClockWise = function (t, o, e) {
    return (e[1] - t[1]) * (o[0] - t[0]) > (o[1] - t[1]) * (e[0] - t[0])
};

plotTools.getBezierPoints = function (t) {
    if (t.length <= 2) return t;
    for (var o = [], e = t.length - 1, r = 0; 1 >= r; r += .01) {
        for (var n = y = 0, g = 0; e >= g; g++) {
            var i = plotTools.getBinomialFactor(e, g), s = Math.pow(r, g), a = Math.pow(1 - r, e - g);
            n += i * s * a * t[g][0], y += i * s * a * t[g][1]
        }
        o.push([n, y])
    }
    return o.push(t[e]), o
};

plotTools.getBinomialFactor = function (t, o) {
    return plotTools.getFactorial(t) / (plotTools.getFactorial(o) * plotTools.getFactorial(t - o))
};

plotTools.getFactorial = function (t) {
    if (1 >= t) return 1;
    if (2 == t) return 2;
    if (3 == t) return 6;
    if (4 == t) return 24;
    if (5 == t) return 120;
    for (var o = 1, e = 1; t >= e; e++) o *= e;
    return o
};

plotTools.getArrowPoints = function (t, o, e, r) {
    var n = plotTools.mid(t, o), g = plotTools.distance(n, e), i = plotTools.getThirdPoint(e, n, 0, .3 * g, !0),
        s = plotTools.getThirdPoint(e, n, 0, .5 * g, !0);
    i = plotTools.getThirdPoint(n, i, plotTools.P.HALF_PI, g / 5, r), s = plotTools.getThirdPoint(n, s, plotTools.P.HALF_PI, g / 4, r);
    var a = [n, i, s, e],
        l = plotTools.getArrowHeadPoints(a, plotTools.P.headHeightFactor, plotTools.P.headWidthFactor, plotTools.P.neckHeightFactor, plotTools.P.neckWidthFactor),
        u = l[0], c = l[4], p = plotTools.distance(t, o) / plotTools.getBaseLength(a) / 2,
        h = plotTools.getArrowBodyPoints(a, u, c, p), d = h.length, f = h.slice(0, d / 2), E = h.slice(d / 2, d);
    return f.push(u), E.push(c), f = f.reverse(), f.push(o), E = E.reverse(), E.push(t), f.reverse().concat(l, E)
};

plotTools.TailedSquadCombat.getTailPoints = function (t) {
    var o = plotTools.getBaseLength(t), e = o * plotTools.P.tailWidthFactor,
        r = plotTools.getThirdPoint(t[1], t[0], plotTools.P.HALF_PI, e, !1),
        n = plotTools.getThirdPoint(t[1], t[0], plotTools.P.HALF_PI, e, !0), g = e * plotTools.P.swallowTailFactor,
        i = plotTools.getThirdPoint(t[1], t[0], 0, g, !0);
    return [r, i, n]
}

plotTools.getCurvePoints = function (t, o) {
    for (var e = plotTools.getLeftMostControlPoint(o), r = [e], n = 0; n < o.length - 2; n++) {
        var g = o[n], i = o[n + 1], s = o[n + 2], a = plotTools.getBisectorNormals(t, g, i, s);
        r = r.concat(a)
    }
    var l = plotTools.getRightMostControlPoint(o);
    r.push(l);
    var u = [];
    for (n = 0; n < o.length - 1; n++) {
        g = o[n], i = o[n + 1], u.push(g);
        for (var t = 0; t < plotTools.P.FITTING_COUNT; t++) {
            var c = plotTools.getCubicValue(t / plotTools.P.FITTING_COUNT, g, r[2 * n], r[2 * n + 1], i);
            u.push(c)
        }
        u.push(i)
    }
    return u
};

plotTools.getLeftMostControlPoint = function (o) {
    var e = o[0], r = o[1], n = o[2], g = plotTools.getBisectorNormals(0, e, r, n), i = g[0],
        s = plotTools.getNormal(e, r, n), a = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
    if (a > plotTools.P.ZERO_TOLERANCE) var l = plotTools.mid(e, r), u = e[0] - l[0], c = e[1] - l[1],
        p = plotTools.distance(e, r), h = 2 / p, d = -h * c, f = h * u, E = d * d - f * f, v = 2 * d * f,
        A = f * f - d * d, _ = i[0] - l[0], y = i[1] - l[1], m = l[0] + E * _ + v * y,
        O = l[1] + v * _ + A * y; else m = e[0] + t * (r[0] - e[0]), O = e[1] + t * (r[1] - e[1]);
    return [m, O]
};

plotTools.getBisectorNormals = function (t, o, e, r) {
    var n = plotTools.getNormal(o, e, r), g = Math.sqrt(n[0] * n[0] + n[1] * n[1]), i = n[0] / g, s = n[1] / g,
        a = plotTools.distance(o, e), l = plotTools.distance(e, r);
    if (g > plotTools.P.ZERO_TOLERANCE) if (plotTools.isClockWise(o, e, r)) {
        var u = t * a, c = e[0] - u * s, p = e[1] + u * i, h = [c, p];
        u = t * l, c = e[0] + u * s, p = e[1] - u * i;
        var d = [c, p]
    } else u = t * a, c = e[0] + u * s, p = e[1] - u * i, h = [c, p], u = t * l, c = e[0] - u * s, p = e[1] + u * i, d = [c, p]; else c = e[0] + t * (o[0] - e[0]), p = e[1] + t * (o[1] - e[1]), h = [c, p], c = e[0] + t * (r[0] - e[0]), p = e[1] + t * (r[1] - e[1]), d = [c, p];
    return [h, d]
};

plotTools.getNormal = function (t, o, e) {
    var r = t[0] - o[0], n = t[1] - o[1], g = Math.sqrt(r * r + n * n);
    r /= g, n /= g;
    var i = e[0] - o[0], s = e[1] - o[1], a = Math.sqrt(i * i + s * s);
    i /= a, s /= a;
    var l = r + i, u = n + s;
    return [l, u]
};

plotTools.getRightMostControlPoint = function (o) {
    var e = o.length, r = o[e - 3], n = o[e - 2], g = o[e - 1], i = plotTools.getBisectorNormals(0, r, n, g),
        s = i[1], a = plotTools.getNormal(r, n, g), l = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
    if (l > plotTools.P.ZERO_TOLERANCE) var u = plotTools.mid(n, g), c = g[0] - u[0], p = g[1] - u[1],
        h = plotTools.distance(n, g), d = 2 / h, f = -d * p, E = d * c, v = f * f - E * E, A = 2 * f * E,
        _ = E * E - f * f, y = s[0] - u[0], m = s[1] - u[1], O = u[0] + v * y + A * m,
        T = u[1] + A * y + _ * m; else O = g[0] + t * (n[0] - g[0]), T = g[1] + t * (n[1] - g[1]);
    return [O, T]
};

plotTools.getCubicValue = function (t, o, e, r, n) {
    t = Math.max(Math.min(t, 1), 0);
    var g = 1 - t, i = t * t, s = i * t, a = g * g, l = a * g,
        u = l * o[0] + 3 * a * t * e[0] + 3 * g * i * r[0] + s * n[0],
        c = l * o[1] + 3 * a * t * e[1] + 3 * g * i * r[1] + s * n[1];
    return [u, c]
};

/*plotTools.save = function (evenId, gcId) {
    debugger;
    //保存三维平台数据
    if(L.dh.public.checkMapType()=="3D"){
        sgTool.Create3D.addToPlotsSource();
    }
    var params = {
        token: L.dh.user.data.token,
        points: plotTools.info,
        EventID: evenId,
        EventGcID: gcId

    };
    L.dh.ajax.post2(baseInterface.saveYjbh, encodeURI(encodeURI(JSON.stringify(params)))
        , true, plotTools, function (req) {
            if (req != null) {
                if (!req.result) {
                    alert('标绘保存失败！');
                }
            }
        }, function () {
            alert('服务请求失败!请检查网络');
        });
};*/

plotTools.show = function (eventId, id) {
    plotTools.info = [];
    plotTools.Searchinfo = [];
    plotTools.comPoint = [];
    plotTools.featureGroup.clearLayers();
    plotTools.pointGroup.clearLayers();
    if(L.dh.public.checkMapType()=="3D"){
        sgTool.Create3D.deleteAllSource();
    }
    var params = {
        token: L.dh.user.data.token,
        EventID: eventId,
        EventGcID: id
    };
    L.dh.ajax.getAjax(baseInterface.getYjbh, params, "json", false, plotTools, function (req) {
        if (req.code == "1") {
            if (req.result.length > 0) {
                req.result.forEach(function (v) {
                    if ((v.sysBh).length > 0) {
                        var pts = eval("(" + v.sysBh + ")");
                        plotTools.info = plotTools.info.concat(pts);
                        //保存三维平台数据
                        if(L.dh.public.checkMapType()=="3D"){
                            sgTool.pushInfo2D();
                        }else {
                            plotTools.createPolt(pts);
                        }

                    }
                })
                plotTools.tempLines = [];
            }

        } else {
            alert('服务请求失败!');
        }
    });
};
//矩形查询范围显示
plotTools.showSearchPolygon = function (searchFW) {
    //plotTools.cancleSearchPolygon();
    if(searchFW!="" && searchFW!="null"){
        var pts = eval("(" + searchFW + ")");
        plotTools.Searchinfo = pts;
        plotTools.createPolt(pts);
        L.dh.public.isPolygonSearch=true;

    }
};
//有完整锚点坐标创建标绘图形
plotTools.createPolt = function (pts) {
    //删除标绘图形历史记录
    plotTools.featureGroup.removeLayer(plotTools.movelayer);
    for (var i = 0; i < pts.length; i++)
    {
        //根据数据源设置工具箱样式信息
        plotTools.AddStyle(pts[i]);
        switch (pts[i].name) {
            case plotTools.PlotTypes.FINE_ARROW:
                plotTools.redrawPolygon(plotTools.Plot_FineArrow(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.SQUAD_COMBAT:
                plotTools.redrawPolygon(plotTools.Plot_SquadCombat(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.TAILED_SQUAD_COMBAT:
                plotTools.redrawPolygon(plotTools.Plot_TailedSquadCombat(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.ASSAULT_DIRECTION:
                plotTools.redrawPolygon(plotTools.Plot_AssaultDirection(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.STRAIGHT_ARROW:
                plotTools.redrawLine(plotTools.Plot_StraightArrow(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.MARKER:
                plotTools.tempLines = L.circleMarker(pts[i].points[0], plotTools.fillstyle);
                plotTools.tempLines.options.id = pts[i].id;
                plotTools.featureGroup.addLayer(plotTools.tempLines);
                plotTools.movelayer = plotTools.tempLines;

                break;
            case plotTools.PlotTypes.CURVE:
                plotTools.redrawLine(plotTools.Plot_Curve(pts[i].points), pts[i].id);
                break;
            case plotTools.PlotTypes.POLYLINE:
                plotTools.redrawLine(pts[i].points, pts[i].id);
                break;
            case plotTools.PlotTypes.FREEHAND_LINE:
                plotTools.redrawLine(pts[i].points, pts[i].id);
                break;
            case plotTools.PlotTypes.POLYGON:
                plotTools.redrawPolygon(pts[i].points, pts[i].id);
                break;
            case plotTools.PlotTypes.FREEHAND_POLYGON:
                plotTools.redrawPolygon(pts[i].points, pts[i].id);
                break;
            case  plotTools.PlotTypes.labelText://文本标签重绘
                //文本标签矩形中心点坐标
                var lanlng={"lat":pts[i].points[0][0],"lng":pts[i].points[0][1]};
                //根据宽、高计算对角坐标
                var point2=plotTools.getRegPoint(lanlng,pts[i].width.replace("px",""),pts[i].height.replace("px",""));
                pts[i].points=[pts[i].points[0]].concat(point2);//更新坐标
                plotTools.tempLines = L.rectangle(point2,{color: plotTools.rectangleMeasure.color, weight: 1});
                plotTools.tempLines.options.id =  pts[i].id;
                plotTools.featureGroup.addLayer(plotTools.tempLines);
                //在矩形中创建文本DIV
                var textarea = new L.DivIcon({
                    className: 'leaflet-illustrate-textbox-container',
                    html: '<textarea id='+pts[i].id+' style="width: 100%; height: 100%;">'+pts[i].content+'</textarea>',
                    iconAnchor: new L.Point(0, 0)
                });
                //获取文本中心点坐标
                var center_point = plotTools.tempLines.getCenter();
                var l_latlngs=plotTools.tempLines._latlngs;//文本角点坐标
                var id= pts[i].id;
                plotTools.featureGroup.removeLayer(plotTools.tempLines);
                plotTools.tempLines=  plotTools.label.txtly(center_point, { icon: textarea, rotation: 0 });//创建文本标签
                plotTools.tempLines.options.id =id;
                plotTools.tempLines.options.name= plotTools.PlotTypes.labelText;
                plotTools.tempLines.options.fontColor=pts[i].fontCol;
                plotTools.tempLines.options.fontSize=pts[i].fontSize;
                plotTools.tempLines.addTo(plotTools.featureGroup);//添加到标绘图层中
                plotTools.label.resize(l_latlngs[0],center_point, plotTools.tempLines);//重新设置文本大小
                plotTools.label.updateStyle();//设置文本标签样式
                plotTools.movelayer =plotTools.tempLines;
                break;
            case plotTools.PlotTypes.SEARCHPOLYGON:
                plotTools.redrawSearchPolygon(pts[i].points, pts[i].id);
                break;
        }
    }


};
//根据Id删除数据源信息
plotTools.delete = function (id) {
    if(plotTools.Searchinfo!=null && plotTools.Searchinfo.length>0 && plotTools.Searchinfo[0].id==id){
        plotTools.Searchinfo=[];
        L.dh.public.polygonSearch(false);
    }else{
        plotTools.info.forEach(function (value, index) {
            if (value.id == id) {
                plotTools.info.splice(index, 1);
            }
        });
    }


};

//生成UUID
plotTools.uuid = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
};
//根据中心点p(纬度)，长l，宽w 获取矩形对角点坐标
plotTools.getRegPoint=function(p,l,w){
    var m=core.map.latLngToLayerPoint(p).round()
    var a=[m.x+l/2,m.y+w/2];
    var b=[m.x-l/2,m.y-w/2];
    return [[core.map.layerPointToLatLng(a).lat,core.map.layerPointToLatLng(a).lng],
        [core.map.layerPointToLatLng(b).lat,core.map.layerPointToLatLng(b).lng]]
};

//面积测量
plotTools.rectangleMeasure = {
    startPoint: [],
    endPoint: null,
    rectangle: null,
    tips: null,
    layer: null,
    color: "#0D82D7",
    addRectangle: function () {//绘制矩形
        var bounds = plotTools.rectangleMeasure.startPoint.slice(0);
        bounds.push([plotTools.rectangleMeasure.endPoint.lat, plotTools.rectangleMeasure.endPoint.lng]);
        plotTools.rectangleMeasure.rectangle = L.polygon(bounds, {
            color: plotTools.rectangleMeasure.color
        });
        plotTools.rectangleMeasure.rectangle.addTo(plotTools.rectangleMeasure.layer);
        var area = plotTools.rectangleMeasure.ComputePolygonArea(plotTools.transformPoint(bounds));
        plotTools.rectangleMeasure.addTips(area.toFixed(3));
        plotTools.rectangleMeasure.layer.addTo(core.map);
    },
    addTips: function (area) {//绑定tip 显示面积
        plotTools.rectangleMeasure.tips = L.circleMarker(plotTools.rectangleMeasure.endPoint, {color: plotTools.rectangleMeasure.color});
        plotTools.rectangleMeasure.tips.setRadius(5);
        plotTools.rectangleMeasure.tips.bindTooltip("面积：" + area + "(平方公里)", {
            permanent: true,
            offset: [0, 0],
            direction: "right",
            interactive: true,
            sticky: true,
            className: 'anim-tooltip',
        }).openTooltip();
        plotTools.rectangleMeasure.tips.addTo(plotTools.rectangleMeasure.layer);
    },
    mousedown: function (e) {
        plotTools.rectangleMeasure.rectangle = null;
        plotTools.rectangleMeasure.tips = null;
        plotTools.rectangleMeasure.startPoint.push([e.latlng.lat, e.latlng.lng]);
        core.map.on('mousemove', plotTools.rectangleMeasure.mousemove);
    },
    mousemove: function (e) {
        plotTools.rectangleMeasure.layer.clearLayers();
        plotTools.rectangleMeasure.endPoint = e.latlng;
        plotTools.rectangleMeasure.addRectangle();
    },
    onDoubleClick: function () {
        plotTools.rectangleMeasure.layer.clearLayers();
        plotTools.rectangleMeasure.startPoint = [];
        core.map.off('mousemove', plotTools.rectangleMeasure.mousemove).off('dblclick', plotTools.rectangleMeasure.onDoubleClick).off('mousedown', plotTools.rectangleMeasure.mousedown).off('mouseup', plotTools.rectangleMeasure.mouseup);

    },
    ComputePolygonArea: function (points) {
        var point_num = points.length;
        if (point_num < 3) return 0.0;
        var s = 0;
        for (var i = 0; i < point_num; ++i)
            s += points[i][0] * points[(i + 1) % point_num][1] - points[i][1] * points[(i + 1) % point_num][0];
        return Math.abs(s) * 1e-6 / 2;

    }
};
//长度测量
plotTools.LineMeasure = {
    startPoint: [],
    lineLayer: null,
    tips: null,
    sumLength: 0,
    mousedown: function (e) {
        plotTools.LineMeasure.startPoint.push([e.latlng.lat, e.latlng.lng]);
        if( plotTools.LineMeasure.startPoint.length>1){
            var length = plotTools.distance(plotTools.ToPoint(plotTools.LineMeasure.startPoint[plotTools.LineMeasure.startPoint.length - 2]),
                plotTools.ToPoint(plotTools.LineMeasure.startPoint[plotTools.LineMeasure.startPoint.length - 1])) / 1000;
            plotTools.LineMeasure.sumLength= plotTools.LineMeasure.sumLength+length;
        }

        core.map.on('mousemove', plotTools.LineMeasure.mousemove).on('dblclick', plotTools.LineMeasure.onDoubleClick);
    },
    mousemove: function (e) {
        plotTools.rectangleMeasure.layer.clearLayers();
        var ptsdrw = plotTools.LineMeasure.startPoint.slice(0);
        ptsdrw.push([e.latlng.lat, e.latlng.lng]);
        plotTools.LineMeasure.lineLayer = L.polyline(ptsdrw);
        plotTools.LineMeasure.lineLayer.addTo(plotTools.rectangleMeasure.layer);
        if (ptsdrw.length < 1) return;
        var length = plotTools.distance(plotTools.ToPoint(ptsdrw[ptsdrw.length - 2]), plotTools.ToPoint(ptsdrw[ptsdrw.length - 1])) / 1000;
        var _length= plotTools.LineMeasure.sumLength + length;
        plotTools.LineMeasure.tips = L.circleMarker(e.latlng, {color: plotTools.rectangleMeasure.color});
        plotTools.LineMeasure.tips.setRadius(1);
        plotTools.LineMeasure.tips.bindTooltip("长度为：" + _length.toFixed(3) + "(千米)", {
            permanent: true,
            offset: [0, 0],
            direction: "right",
            interactive: true,
            sticky: true,
            className: 'anim-tooltip',
        }).openTooltip();
        plotTools.LineMeasure.tips.addTo(plotTools.rectangleMeasure.layer);
        plotTools.rectangleMeasure.layer.addTo(core.map);

    },
    onDoubleClick: function () {
        plotTools.rectangleMeasure.layer.clearLayers();
        plotTools.LineMeasure.startPoint = [];
        plotTools.LineMeasure.sumLength=0;
        core.map.off('mousemove', plotTools.LineMeasure.mousemove).off('dblclick', plotTools.LineMeasure.onDoubleClick).off('mousedown', plotTools.LineMeasure.mousedown);
        plotTools.closeTips();
    }
};

//文字标注
plotTools.label={
    layer:null,
    startPoint:null,
    endPoint:null,
    fontColor:'red',
    fontSize:'30px',
    IconPoint:null,
    resize:function (latlngs,center,layer) {
        plotTools.label.layer=layer;
        var  corner = latlngs[1];
        var  oppositeCorner = latlngs[3];
        var  cornerPixelCoordinates =core.map.latLngToLayerPoint(corner).round();
        var  oppositeCornerPixelCoordinates = core.map.latLngToLayerPoint(oppositeCorner).round();
        var  width = oppositeCornerPixelCoordinates.x - cornerPixelCoordinates.x + 2;
        var  height = oppositeCornerPixelCoordinates.y - cornerPixelCoordinates.y + 2;
        plotTools.label.updateCenter(center);
        plotTools.label.updateSize(new L.Point(width, height));
    },
    updateCenter: function(center) {
        plotTools.label.layer.setLatLng(center);
    },
    updateStyle:function () {
        if (plotTools.label.layer._icon) {
            plotTools.label.layer._icon.style.fontWeight = 'bold';
            plotTools.label.layer._icon.style.fontSize =plotTools.label.fontSize;
            plotTools.label.layer._icon.style.color=plotTools.label.fontColor;
            plotTools.label.layer._icon.style.fontFamily = 'Trebuchet MS, Verdana, sans-serif';
            plotTools.label.layer._icon.children[0].style.background='rgba(111,200,100,0)';
            plotTools.label.layer._icon.children[0].style.resize='none';
            plotTools.label.layer._icon.children[0].style.overflowX='hidden';
            plotTools.label.layer._icon.children[0].style.overflowY='hidden';
            plotTools.label.layer._icon.children[0].style.border='none';

        }
    },
    setStyle:function(t,ly){
        if(ly.hasOwnProperty("_icon")&& ly._icon!=null)
        //选中t=true 未选中t=false
        if(t){
            ly._icon.children[0].style.background='rgba(111,200,100,0.2)';
        }else {
            ly._icon.children[0].style.background='rgba(111,200,100,0)';
            ly._icon.style.border='none';
        }
    },
    updateSize: function(size) {
        if (plotTools.label.layer._icon) {
            plotTools.label.layer._icon.style.marginTop = - Math.round(size.y/2) + "px";
            plotTools.label.layer._icon.style.marginLeft = - Math.round(size.x/2) + "px";
            plotTools.label.layer._icon.style.width = size.x + "px";
            plotTools.label.layer._icon.style.height = size.y+ "px";

        }
    },
    txtly:function(latlng, options) {
        L.RotatableMarker = L.Marker.extend({
            initialize: function(latlng, options) {
                L.Marker.prototype.initialize.call(this, latlng, options);
            },
        });
        plotTools.label.IconPoint= L.icon({
            iconUrl: './css/images/Back.png',
            iconSize: [10, 10],
            shadowUrl: './css/images/Back.png',
            shadowSize: [10,10],
        });
        return new L.RotatableMarker(latlng, options)
    },

    createLy:function (layer) {
        var center_point = layer.getCenter();
        var _latlngs=layer._latlngs;
        var _id=layer.options.id;
        var textarea = new L.DivIcon({
            className: 'leaflet-illustrate-textbox-container',
            html: '<textarea id='+_id+' style="width: 100%; height: 100%;"></textarea>',
            iconAnchor: new L.Point(0, 0)
        });
        plotTools.featureGroup.removeLayer(layer);
        layer=  plotTools.label.txtly(center_point, { icon: textarea, rotation: 0});
        layer.options.id =_id;
        layer.options.fontColor=plotTools.label.fontColor;
        layer.options.fontSize=plotTools.label.fontSize;
        layer.addTo(plotTools.featureGroup);
        plotTools.label.resize(_latlngs[0],center_point, layer);
        plotTools.label.updateStyle();
        plotTools.label.setStyle(true,layer);
        var point2=plotTools.getRegPoint(center_point,layer._icon.style.width.replace("px",""),layer._icon.style.height.replace("px",""));
        plotTools.info.push({
            'id': layer.options.id,
            'name': plotTools.drawType,
            'points':plotTools.label.getThreePoint([center_point.lat,center_point.lng],point2),
            'width':layer._icon.style.width,
            'height':layer._icon.style.height,
            'fontCol':plotTools.label.fontColor,
            'fontSize':plotTools.label.fontSize
        });
    },

    getThreePoint:function (center,Point2) {
       return [center].concat(Point2);
    }
};



