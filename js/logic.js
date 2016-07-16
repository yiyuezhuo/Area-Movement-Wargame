
function chain(ll){
  var rl = [];
  ll.forEach(function(l){
    rl = rl.concat(l);
  });
  return rl;
}

function circle(l){
  var i
      rl = [];
  for(i = 0; i < l.length - 1; i++){
    rl.push([l[i], l[i+1]]);
  }
  rl.push([l[i], l[0]]);
  return rl
}

function dict_to_list(dict){
  return Object.keys(dict).map(function(key){
    return {key : key, value : dict[key]};
  });
}

function weightAverage(l,weight){
  return d3.sum(l.map(function(num,i){return num * weight[i]}))/d3.sum(weight);
}

function weightCenter(points, weights){
  var xy = d3.zip.apply(null, points);
  return [weightAverage(xy[0], weights), weightAverage(xy[1], weights)];
}

function getCenter(pairs){
  var circlePairs = circle(pairs)
  lineCenters = circlePairs.map(function(leftRight){
    var left = leftRight[0];
    var right = leftRight[1];
    return [(left[0] + right[0])/2, (left[1] + right[1])/2];
  });
  lineDistances = circlePairs.map(function(leftRight){
    var left = leftRight[0];
    var right = leftRight[1];
    return Math.sqrt(Math.pow(left[0] - right[0],2) + Math.pow(left[1] - right[1],2));
  });
  return weightCenter(lineCenters, lineDistances);
}
        
function loadJSONP(externData){
  
  //var dicData = JSON.parse(dataString);
  var polygons = externData.polygons;
  var centers = externData.centers;
  var info = externData.info;
  
  var data = Object.keys(polygons).map(function(key){
    return [key, polygons[key]];
  });
  
  var dataZip = d3.zip.apply(null, data);
  var xlyl = d3.zip.apply(null, chain(dataZip[1]));
  
  
  var width = d3.max(xlyl[0]) + 10,
      height = d3.max(xlyl[1]) + 10,
      colors = d3.scale.category20();

  var playerColors = {};
  Object.keys(info.player).forEach(function(key, i){
    playerColors[key] = colors(i);
  });
  var waterColor = '#aaaaff';
  var nullColor = '#999999';
      
  var svg = d3.select("body").append("svg")
          .attr("class", "zones")
          .attr("height", height)
          .attr("width", width);    

  var zones = svg.append('g').selectAll('path.zone').data(data).enter();

  
  zones.append('path')
    .attr('class', 'zone')
    .attr('fill', function(d, i){
      var name = d[0];        
      if(info.territory[name] && info.territory[name].water){
        return waterColor;
      }
      else if(info.territoryOwner[name]){
        return playerColors[info.territoryOwner[name]];
      }
      else{
        return nullColor;
      }
      
    })
    .attr('d', function(d, i){
      var name = d[0],
          pairs = d[1];
      return 'M' + pairs.map(function(pair){return pair[0] + ' ' + pair[1]}).join(' L') + 'Z';
    })
    .on('click',function(d){
      console.log(d[0]);
    });
    
  var borders = svg.append('g').selectAll('path.border').data(data).enter();
    
  borders.append('path')
    .attr('class', 'border')
    .attr('fill', function(d, i){
      return 'none';
    })
    .attr('stroke','#000000')
    .attr('stroke-width','2px')
    .attr('d', function(d, i){
      var name = d[0],
          pairs = d[1];
      return 'M' + pairs.map(function(pair){return pair[0] + ' ' + pair[1]}).join(' L') + 'Z';
    });

  var texts = svg.append('g').selectAll('text');

  if(centers === undefined){
    texts.data(data).enter()
      .append('text')
      .attr("transform", function(d) { 
        return "translate(" + getCenter(d[1]).join(',') + ")"; 
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text(function(d) { return d[0]; });
  }
  else{
    texts.data(Object.keys(centers)).enter()
      .append('text')
      .attr("transform", function(d) { 
        return "translate(" + centers[d].join(',') + ")"; 
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text(function(d) { return d; });
  }
  
  var strengthMapping = {};
  Object.keys(centers).forEach(function(territory){
    if(info.territory[territory] === undefined || info.territory[territory].water === true){
      return 0;
    }
    else if(Math.random() > 0.5){
      return 0;
    }
    else{
      strengthMapping[territory] = Math.floor(Math.random() * 10);
    }
  });
  
  var images = svg.append('g').selectAll('image');
  
  var CounterBaseWidth = 48;
  var CounterBaseHeight = 35;
  
  function CounterScale(strength){
    if(strength <= 0){
      return [0,0];
    }
    var percent = 1 - Math.exp(-0.1*(strength + 3));
    return [CounterBaseWidth * percent, CounterBaseHeight * percent];
  }
  
  var CounterImagePath = 'static/Panzer.png';
  
  function strengthUpdate(){
    // it updaate strengthMapping's change to UI
    images = images.data(dict_to_list(strengthMapping), function(obj){
      return obj.key;
    });
    images.enter().append('svg:image')
      .attr('xlink:href', CounterImagePath)
      .attr('width', function(d){
        return CounterScale(d.value)[0];
      })
      .attr('height', function(d){
        return CounterScale(d.value)[1];
      })
      .attr('x', function(d){
        return centers[d.key][0];
      })
      .attr('y', function(d){
        return centers[d.key][1];
      });
    images.attr('x', function(d){
        return centers[d.key][0];
      })
      .attr('y', function(d){
        return centers[d.key][1];
      });
    images.exit().remove();
  }
  
  strengthUpdate();
}


