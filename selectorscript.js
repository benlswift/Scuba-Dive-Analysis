

		function newXHR(){
			var xmlhttp 
			if (window.XMLHttpRequest)
			{// code for IE7+, Firefox, Chrome, Opera, Safari
			   xmlhttp = new XMLHttpRequest();
				
			}
			else
			{// code for IE6, IE5
			   xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			return xmlhttp
		}
		

		
		
		//google.charts.load('current', {'packages':['corechart']});
		google.charts.load('current', {'packages':['line']});
		

		
		function choosePage(id)
		{
			console.log(id)
			pagereq = newXHR()
			pagereq.open("POST","/choose");
			pagereq.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
			pagereq.send("dive="+id)
			pagereq.onload = function(){
				xmlDoc = pagereq.responseXML
				array = []
				google.charts.setOnLoadCallback(drawChart);
				function drawChart()
				{

				var ascention;
				//create time array, depth array, good array, bad array
				//put times into time array
				//put depths into depth array
				//calculate ascention 
				//if ascention bad then depth -> bad array
				//else depth -> good array
				var timeArray = []
				var depthArray = []
				var goodArray = []
				var badArray = []
				var safetyArray = []
				var testArray = [2,4,7,11]
				var testTime = [1,2,3,4]
				times = xmlDoc.getElementsByTagName("time")
				depth = xmlDoc.getElementsByTagName("depth")
				array[0] = [{label: 'Time', type: 'number'},{label: 'Depth', type: 'number'}]
				goodArray[0] = [0]
				badArray[0] = [0]
				safetyEnabled = false
				safetyTime = 0
				console.log(xmlDoc)


				for (i=0; i<Math.min(times.length,depth.length); i++)
				{
					//array[i] = [parseInt(times[i].firstChild.nodeValue), -parseFloat(depth[i].firstChild.nodeValue)]
					timeArray[i] = [parseInt(times[i].firstChild.nodeValue)]
					depthArray[i] = [-parseFloat(depth[i].firstChild.nodeValue)]
					if (i ==0)
					{
						goodArray[i] = 0
					}
					else
					{
						currentTime = parseInt(times[i].firstChild.nodeValue)
						lastTime = parseInt(times[i-1].firstChild.nodeValue)
						currentDepth = parseFloat(depth[i].firstChild.nodeValue)
						lastDepth = parseFloat(depth[i-1].firstChild.nodeValue)
						ascention = ((currentDepth) - (parseFloat(depth[i-1].firstChild.nodeValue)))/((parseInt(times[i].firstChild.nodeValue)) - (parseInt(times[i-1].firstChild.nodeValue)))
						if  (ascention < -0.15)//0.15 m/s
						{
							badArray[i] = [ -currentDepth]
							badArray[i-1] = [ -parseFloat(depth[i-1].firstChild.nodeValue)] 
							goodArray[i] = [ -currentDepth]
						}
						else
						{
							goodArray[i] = [ -currentDepth]
							goodArray[i-1] = [ -parseFloat(depth[i-1].firstChild.nodeValue)]
						}
						if (currentDepth>10)
						{
							safetyEnabled = true;
							safetyTime = 0;
						}
						else if (currentDepth < 7 )
						{
							if (safetyEnabled && safetyTime == 0)
							{
								safetyTime = parseInt(times[i].firstChild.nodeValue)
							}
							else if(safetyEnabled && (currentTime - safetyTime) > 300)
							{
								safetyEnabled = false;
								safetyTime = 0;
							}
						}
						if (safetyEnabled && (currentDepth < 4))
						{
							if (parseFloat(depth[i-1].firstChild.nodeValue) < 4)
							{
								safetyArray[i] = [currentTime,-currentDepth]
							}
							else 
							{
								breachDepth = 4-lastDepth
								interpMul = breachDepth/(currentDepth-lastDepth)
								breachTime = lastTime + ((currentTime - lastTime)*interpMul)
								safetyArray[i-1] = [breachTime,-4]
								safetyArray[i] = [currentTime,-currentDepth]
							}
						}
						else if (safetyEnabled &&lastDepth < 4)
						{
							
							breachDepth = 4-lastDepth
							interpMul = breachDepth/(currentDepth-lastDepth)
							breachTime = lastTime + ((currentTime - lastTime)*interpMul)
							safetyArray[i] = [breachTime,-4]
						}
						else 
						{
							safetyArray[i] = [null,null]
						}
						
					}
				}
				//var data = google.visualization.arrayToDataTable(array);
				var data = new google.visualization.DataTable();
				data.addColumn('number', 'Time');
				data.addColumn('number', 'OK');
				data.addColumn('number', 'Dangerous');
				data.addColumn('number', 'Safety Stop Breach');
				for ( j=0;j<Math.min(times.length,depth.length);j++)
				{
					data.addRows([
					[parseInt(timeArray[j]), parseFloat(goodArray[j]), parseFloat(badArray[j]), null]
				])}
				
					console.log(safetyArray.toString())
				for ( j=0;j<safetyArray.length;j++)
				{
					if (safetyArray[j] != null)
					{
					data.addRows([
					[parseFloat(safetyArray[j][0]), null,null,parseFloat(safetyArray[j][1])]
					])
					}
				}
				//var goodData = google.visualization.arrayToDataTable(arrayGood);
				//var goodBad = google.visualization.arrayToDataTable(arrayBad);

				var options = {
				  title: 'Dive Depth',
				  curveType: 'none',
				  legend: { position: 'bottom' }
				};
			    var options2 = {
					chart: {
					  title: 'Scuba dive safety',
					  subtitle: ''
					},
					width: 900,
					height: 500,
					axes: {
					  x: {
						0: {side: 'top'}
					  }
					}
				  };
				
				//var formatter = new google.visualization.NumberFormat();
				//formatter.format(data, 1);
	
				//var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
				//chart.draw(data, options);
				
				var chart = new google.charts.Line(document.getElementById('curve_chart'));

				chart.draw(data, google.charts.Line.convertOptions(options2));
				}
			}
		}
		
		
		
		
		pagereq = newXHR()
        pagereq.open("GET","/logs");
		pagereq.send();
		pagereq.onload = function () {
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(pagereq.responseText, "application/xml")
			elements = xmlDoc.getElementsByTagName("name")
			list = document.getElementsByName("listDives")[0]
			for (i=0; i<elements.length; i++){
				button = document.createElement("button")
				buttonText = document.createTextNode(elements[i].childNodes[0].nodeValue)
				button.appendChild(buttonText)
				button.id = i
				button.onclick = function() {choosePage(this.id)}
				list.appendChild(button)
			}
		};
		
		function nextPage()
		{
			nextreq = newXHR()
			nextreq.open("GET","/next");
			nextreq.send();
			nextreq.onload = function () {
				var parser = new DOMParser();
				xmlDoc = parser.parseFromString(nextreq.responseText, "application/xml")
				list = document.getElementsByName("listDives")[0]
				childlist = list.children
				length = childlist.length 
				for (i=0; i<length; i++)
				{
					childlist[0].remove()
				}


				elements = xmlDoc.getElementsByTagName("name")
				console.log("elements is "+ elements.length + " long")
				for (i=0; i<elements.length; i++){
					button = document.createElement("button")
					buttonText = document.createTextNode(elements[i].childNodes[0].nodeValue)
					button.appendChild(buttonText)
					button.id = i
					button.onclick = function() {choosePage(this.id)}
					list.appendChild(button)
				}
			};
		}
		function prevPage()
		{
			prevreq = newXHR()
			prevreq.open("GET","/prev");
			prevreq.send();
			prevreq.onload = function () {
				var parser = new DOMParser();
				xmlDoc = parser.parseFromString(prevreq.responseText, "application/xml")
				list = document.getElementsByName("listDives")[0]
				childlist = list.children
				length = childlist.length 
				for (i=0; i<length; i++)
				{
					childlist[0].remove()
				}


				elements = xmlDoc.getElementsByTagName("name")
				for (i=0; i<elements.length; i++){
					button = document.createElement("button")
					buttonText = document.createTextNode(elements[i].childNodes[0].nodeValue)
					button.appendChild(buttonText)
					button.id = i
					button.onclick = function() {choosePage(this.id)}
					list.appendChild(button)
				}
			};
		}
		
		
		