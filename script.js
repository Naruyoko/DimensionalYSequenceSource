var lineBreakRegex=/\r?\n/g;
var itemSeparatorRegex=/[\t ,]/g;
window.onload=function (){
  console.clear();
  dg('input').onkeydown=handlekey;
  dg('input').onfocus=handlekey;
  dg('input').onmousedown=handlekey;
  load();
  convertall();
}
function dg(s){
  return document.getElementById(s);
}
var calculatedMountains=null;
function parseSequenceElement(s,i){
  if (s.indexOf("v")==-1||!isFinite(Number(s.substring(s.indexOf("v")+1)))){
    var numval=Number(s);
    return {
      value:numval,
      position:i,
      parentIndex:-1
    };
  }else{
    return {
      value:Number(s.substring(0,s.indexOf("v"))),
      position:i,
      parentIndex:Math.max(Math.min(i-1,Number(s.substring(s.indexOf("v")+1))),-1),
      forcedParent:true
    };
  }
}
function calcMountain(s){
  //if (!/^(\d+,)*\d+$/.test(s)) throw Error("BAD");
  var lastLayer;
  if (typeof s=="string"){
    lastLayer=s.split(itemSeparatorRegex).map(parseSequenceElement);
  }
  else lastLayer=s;
  var calculatedMountain=[lastLayer]; //rows
  while (true){
    //assign parents
    var hasNextLayer=false;
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].forcedParent){
        if (lastLayer[i].parentIndex!=-1) hasNextLayer=true;
        continue;
      }
      var p;
      if (calculatedMountain.length==1){
        p=lastLayer[i].position+1;
      }else{
        p=0;
        while (calculatedMountain[calculatedMountain.length-2][p].position<lastLayer[i].position+1) p++;
      }
      while (true){
        if (p<0) break;
        var j;
        if (calculatedMountain.length==1){
          p--;
          j=p-1;
        }else{ //ignoring
          p=calculatedMountain[calculatedMountain.length-2][p].parentIndex;
          if (p<0) break;
          j=0;
          while (lastLayer[j].position<calculatedMountain[calculatedMountain.length-2][p].position-1) j++;
        }
        if (j<0||j<lastLayer.length-1&&lastLayer[j].position+1!=lastLayer[j+1].position) break;
        if (lastLayer[j].value<lastLayer[i].value){
          lastLayer[i].parentIndex=j;
          hasNextLayer=true;
          break;
        }
      }
    }
    if (!hasNextLayer) break;
    var currentLayer=[];
    calculatedMountain.push(currentLayer);
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].parentIndex!=-1){
        currentLayer.push({value:lastLayer[i].value-lastLayer[lastLayer[i].parentIndex].value,position:lastLayer[i].position-1,parentIndex:-1});
      }
    }
    lastLayer=currentLayer;
  }
  return calculatedMountain;
}
function cloneMountain(mountain){
  var newMountain=[];
  for (var i=0;i<mountain.length;i++){
    var layer=[];
    for (var j=0;j<mountain[i].length;j++){
      layer.push({
        value:mountain[i][j].value,
        position:mountain[i][j].position,
        parentIndex:mountain[i][j].parentIndex,
        forcedParent:mountain[i][j].forcedParent
      });
    }
    newMountain.push(layer);
  }
  return newMountain;
}
function parseMatrix(s){
  if (!/^(\(\d*(,\d*)*\))*$/.test(s)) return [];
  var matrix=JSON.parse(
    "["+s
      .replace(itemSeparatorRegex,",")
      .replace(/\(/g,"[")
      .replace(/\)/g,"]")
      .replace(/\]\[/g,"],[")+"]");
  var columns=matrix.length;
  var rows=0;
  for (var i=0;i<columns;i++){
    if (matrix[i].length>rows){
      rows=matrix[i].length;
    }
  }
  for (var i=0;i<columns;i++){
    while (matrix[i].length<rows){
      matrix[i].push(0);
    }
  }
  return matrix;
}
function cloneMatrix(matrix){
  var newMountain=[];
  for (var i=0;i<matrix.length;i++) newMountain.push(mountain[i].slice(0));
  return newMountain;
}
var DIRECTION="D";
function Y_to_M(s){
  var mountain;
  if (typeof s=="string") mountain=calcMountain(s);
  else mountain=cloneMountain(s);
  var matrix=[];
  for (var i=0;i<mountain[0].length;i++) matrix.push([]);
  for (var h=0;h<mountain.length;h++){
    for (var i=0;i<mountain[h].length;i++){
      matrix[mountain[h][i].position+h][h]=mountain[h][i].parentIndex==-1?0:matrix[mountain[h][mountain[h][i].parentIndex].position+h][h]+1;
    }
  }
  for (var i=0;i<mountain[0].length;i++){
    while (matrix[i][matrix[i].length-1]===0&&matrix[i].length>1) matrix[i].pop();
  }
  return matrix.map(e=>"("+e.join(",")+")").join("");
}
function M_to_Y(s){
  var matrix;
  if (typeof s=="string") matrix=parseMatrix(s);
  else matrix=cloneMatrix(s);
  for (var i=0;i<matrix.length;i++){
    while (matrix[i][matrix[i].length-1]===0&&matrix[i].length>1) matrix[i].pop();
    matrix[i].push(0);
  }
  var hydra=[];
  for (var i=0;i<matrix.length;i++){
    hydra.push([]);
    for (var j=0;j<matrix[i].length;j++){
      var p=i;
      hydra[i][j]=-1;
      while (p>=0){
        if (matrix[p][j]<matrix[i][j]){
          hydra[i][j]=p;
          break;
        }
        if (j===0){
          p--;
        }else{
          p=hydra[p][j-1];
        }
      }
    }
  }
  var mountain=[];
  for (var i=0;i<matrix.length;i++){
    for (var h=0;h<matrix[i].length;h++){
      if (mountain.length-1<h) mountain.push([]);
      if (hydra[i][h]==-1){
        mountain[h].push({
          value:1,
          position:i-h,
          parentIndex:-1
        })
      }else{
        var j=0;
        while (mountain[h][j].position+h<hydra[i][h]) j++;
        mountain[h].push({
          value:NaN,
          position:i-h,
          parentIndex:j
        });
      }
    }
  }
  //Build number from ltr, ttb
  for (var i=mountain.length-1;i>=0;i--){
    if (!mountain[i].length){
      mountain.pop();
      continue;
    }
    for (var j=0;j<mountain[i].length;j++){
      if (!isNaN(mountain[i][j].value)) continue;
      var k=0; //find left-up
      while (mountain[i+1][k].position<mountain[i][j].position-1) k++;
      if (mountain[i+1][k].position!=mountain[i][j].position-1) throw Error("Mountain not complete");
      mountain[i][j].value=mountain[i][mountain[i][j].parentIndex].value+mountain[i+1][k].value;
    }
  }
  return mountain[0].map(e=>e.value).join(",");
}
var input="";
function convertall(recalculate){
  if (!recalculate&&input==dg("input").value) return;
  input=dg("input").value;
  dg("output").value=input.split(lineBreakRegex).map(DIRECTION=="D"?Y_to_M:M_to_Y).join("\r\n");
}
function toggledirection(){
  if (DIRECTION=="D"){
    DIRECTION="Y";
    dg("toggledirectionbutton").value="DBMS->Y";
  }else{
    DIRECTION="D";
    dg("toggledirectionbutton").value="Y->DBMS";
  }
  convertall(true);
}
function swap(){
  dg("input").value=dg("output").value;
  toggledirection();
}
window.onpopstate=function (e){
  load();
  convertall(true);
}
function save(clipboard){
  var encodedInput;
  if (DIRECTION=="D"){
    var encodedInput=input.split(lineBreakRegex).map(e=>e.split(itemSeparatorRegex).map(parseSequenceElement).map(e=>e.value)).join(";")+";"+DIRECTION;
  }else if (DIRECTION=="Y"){
    var encodedInput=input.split(lineBreakRegex).map(e=>parseMatrix(e).map(e=>e.join(",").replace(/(,0)+$/,"")).join("_")).join(";")+";"+DIRECTION;
  }
  history.pushState(encodedInput,"","?"+encodedInput);
  if (clipboard){
    var copyarea=dg("copyarea");
    copyarea.value=location.href;
    copyarea.style.display="";
    copyarea.select();
    copyarea.setSelectionRange(0,99999);
    document.execCommand("copy");
    copyarea.style.display="none";
  }
}
function load(){
  var state=location.search.substring(1);
  if (!state) return;
  var input=state.split(";");
  if (["D","Y"].includes(input[input.length-1])) DIRECTION=input.pop();
  if (DIRECTION=="D"){
    input=input.join("\r\n");
    dg("toggledirectionbutton").value="Y->DBMS";
  }else{
    input=input.map(e=>"("+e.replace(/_/g,")(")+")").join("\r\n");
    dg("toggledirectionbutton").value="DBMS->Y";
  }
  dg("input").value=input;
}
var handlekey=function(e){
  setTimeout(convertall,0);
}