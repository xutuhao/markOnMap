	var toolsIsOpen = false;
	var core = {map:{}};
	function init(){
		//添加底图
		var southWest = L.latLng(26, 116.5),
			northEast = L.latLng(32, 124.4),
			bounds = L.latLngBounds(southWest, northEast);
		
		var map = L.map('map', {
			// crs: crs,
			// center: [29.231858, 120.105835],
			// zoom: 6
			crs:L.CRS.CustomEPSG4326,
			center: {lon:120.33999, lat:29.231858},
			zoom:7,
			inertiaDeceleration:15000,
			maxZoom:15,
			minZoom:7,
			maxBounds:bounds,
			zoomControl:false
		});
		
		//影像图
		var zjVecTilelayer = new L.GXYZ('http://ditu2.zjzwfw.gov.cn/mapserver/vmap/zjvmap/getMAP?x={x}&y={y}&l={z}&styleId=kejiyangshi2_2017',{tileSize:512,maxZoom:20});
		// 添加注记图层
		var zjVecTileLablayer = new L.GWVTAnno({tileSize:512,opacity:1});
		var dataSource = new Custom.URLDataSource();
		dataSource.url ='http://ditu.zjzwfw.gov.cn/mapserver/label/zjvmap/getDatas?x=${x}&y=${y}&l=${z}&styleId=tdt_kejiganyangshi_2017';
		zjVecTileLablayer.addDataSource(dataSource);
		var zj_vecTileGroup = L.layerGroup([zjVecTilelayer,zjVecTileLablayer]);
		
		var layer = new L.GXYZ('http://ditu.zjzwfw.gov.cn/mapserver/vmap/zjvmap/getMAP?x={x}&y={y}&l={z}&styleId=tdt_biaozhunyangshi_2017',{tileSize:512});
		//添加注记
		var labelLayer = new L.GWVTAnno({tileSize:512});
		var dataSource2 = new Custom.URLDataSource();
		dataSource2.url ='http://ditu.zjzwfw.gov.cn/mapserver/label/zjvmap/getDatas?x={x}&y={y}&l={z}&styleId=tdt_biaozhunyangshi_2017';
		labelLayer.addDataSource(dataSource2);
		var layerGroup = L.layerGroup([layer,labelLayer]);
		//map.addLayer(labelLayer);
		map.addLayer(layerGroup);
		core.map = map;
		var baseMaps = { 
			"矢量图": layerGroup, 
			"影像图": zj_vecTileGroup
		};
		// 添加图层切换控件
		L.control.layers(baseMaps).addTo(map);
		// 添加图层缩放控件
		L.control.zoom({ position: 'topright' }).addTo(map);
		
		plotTools.init();
	   
	}
	function openToolsBox(){
		$("#left")[0].style.width = "260px"
		document.getElementsByClassName("rightMenu")[0].style.display="block";
		toolsIsOpen = true;
	}
	function closeToolsBox(){
		$("#left")[0].style.width = ""
		document.getElementsByClassName("rightMenu")[0].style.display="none";
		toolsIsOpen = false;
	}
	function mouseOver(e){
		e.style.textDecoration = "underline";
	}
	function mouseOut(e){
		e.style.textDecoration = "";
	}