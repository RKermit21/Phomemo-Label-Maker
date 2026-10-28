const CODE128_PATTERNS=[[2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],[1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],[2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],[1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],[2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],[3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],[2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],[1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],[2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],[1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],[2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],[3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],[3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],[1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],[1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],[2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],[1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],[2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],[1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],[1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],[2,1,1,2,3,2]];
const $=id=>document.getElementById(id);
const state={tape:14,length:40,data:"PW012345",title:"Property of Fresno Unified School District",titleOn:true,humanOn:true,barHeight:5.2,textSize:21,titleSize:16,narrow:.262,quiet:8,gap:.125,darkness:6,copies:1,center:0,titleX:null,titleY:null,titleW:null,titleH:null,barcodeX:null,barcodeY:null,barcodeW:null,barcodeH:null,dataX:null,dataY:null,dataW:null,dataH:null,selected:"title",snap:true,guides:true};
let printerDevice=null, printerChar=null, queue=[],drag=null;
function code128Values(text){
 if(!text)text=" ";
 if(!/^[\x20-\x7E]+$/.test(text))throw Error("Code 128 supports printable ASCII characters only in this build.");
 // Use Code Set C for numeric pairs where possible, keeping any odd leading digit in Set B.
 let vals=[];let i=0;
 if(/^\d+$/.test(text)&&text.length>=4){
   if(text.length%2){vals=[104,text.charCodeAt(0)-32,99];i=1;}else{vals=[105];i=0;}
   for(;i<text.length;i+=2) vals.push(Number(text.slice(i,i+2)));
 }else{vals=[104];for(const ch of text)vals.push(ch.charCodeAt(0)-32);}
 let sum=vals[0];for(let j=1;j<vals.length;j++)sum+=vals[j]*j;vals.push(sum%103);return vals;
}
function code128Patterns(text){return code128Values(text).map(v=>{const pattern=CODE128_PATTERNS[v];if(!pattern)throw Error(`Missing Code 128 pattern for symbol ${v}.`);return pattern}).concat([[2,3,3,1,1,1,2]])}
function drawBarcode(ctx,text,x,y,w,h,unit,quiet){
 const seq=code128Patterns(text),barsWidth=seq.flat().reduce((a,b)=>a+b,0),total=quiet*2+barsWidth;
 // Preserve the selected narrow-bar setting unless the object has been resized narrower than the symbol needs.
 const scale=Math.max(.5,Math.min(unit,w/total));
 const used=total*scale;let pos=x+(w-used)/2+quiet*scale;
 for(const p of seq){let bar=true;for(const n of p){if(bar)ctx.fillRect(Math.round(pos),Math.round(y),Math.max(1,Math.round(n*scale)),Math.round(h));pos+=n*scale;bar=!bar}}
 return used;
}
function dims(){return {w:Math.round(state.length*203/25.4),h:Math.round(state.tape*203/25.4)}}
function render(){
 const c=$("labelCanvas"),ctx=c.getContext("2d"),d=dims(),scale=2;c.width=d.w*scale;c.height=d.h*scale;ctx.setTransform(scale,0,0,scale,0,0);
 ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);
 // The D30 can only print a 12 mm band. Wider 14/15 mm stock is shown at its
 // true tape height, with the 12 mm printable band centered inside it.
 const printH=Math.round(12*203/25.4), printY=(d.h-printH)/2;
 ctx.save();ctx.fillStyle="#f7f9fc";ctx.fillRect(0,printY,d.w,printH);ctx.restore();
 const pxmm=203/25.4, pad=state.quiet*state.narrow*pxmm, barH=state.barHeight*pxmm;
 const titleH=state.titleH??(state.titleSize*1.2+4), textH=state.dataH??(state.textSize*1.3);
 let titleOutlineBox=null;
 const titleBox={x:state.titleX??4,y:state.titleY??printY+2,w:state.titleW??d.w-8,h:state.titleH??titleH};
 const barBox={x:state.barcodeX??pad,y:state.barcodeY??(printY+(state.titleOn?titleH+2:4)),w:state.barcodeW??(d.w-2*pad),h:state.barcodeH??barH};
 const dataBox={x:state.dataX??4,y:state.dataY??(barBox.y+barBox.h+state.gap*pxmm),w:state.dataW??d.w-8,h:state.dataH??textH};
 ctx.fillStyle="#000";ctx.textBaseline="top";
 if(state.titleOn){
   ctx.fillStyle="#000";ctx.textAlign="center";ctx.textBaseline="top";
   let fs=state.titleSize;ctx.font=`500 ${fs}px "Arial", "Helvetica Neue", sans-serif`;
   const lines=wrapText(ctx,state.title,Math.max(10,titleBox.w-6));
   while(fs>7&&lines.length*fs*1.15>titleBox.h){fs-=.5;ctx.font=`500 ${fs}px "Arial", "Helvetica Neue", sans-serif`}
   const finalLines=wrapText(ctx,state.title,Math.max(10,titleBox.w-6));
   const lineWidths=finalLines.map(line=>Math.min(ctx.measureText(line).width,Math.max(10,titleBox.w-6)));
   const visualW=Math.max(8,...lineWidths), visualH=Math.max(8,finalLines.length*fs*1.15);
   titleOutlineBox={x:titleBox.x+titleBox.w/2-visualW/2-3,y:titleBox.y-2,w:visualW+6,h:visualH+4};
   finalLines.forEach((line,i)=>ctx.fillText(line,titleBox.x+titleBox.w/2,titleBox.y+i*fs*1.15,Math.max(10,titleBox.w-6)));
 }
 try{drawBarcode(ctx,state.data||" ",barBox.x,barBox.y,barBox.w,barBox.h,state.narrow*pxmm,state.quiet)}catch(err){ctx.fillStyle="#b42318";ctx.font="8px Arial";ctx.fillText("Barcode data error: "+err.message,4,4)}
 if(state.humanOn){ctx.fillStyle="#000";ctx.font=`500 ${state.textSize}px Arial, "Helvetica Neue", sans-serif`;ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(state.data,dataBox.x+dataBox.w/2,dataBox.y,Math.max(10,dataBox.w))}
 // Selection outline and resize handle are preview-only; hidden for PNG/printing.
 if(state.guides){
   // Fine, low-contrast guides. The center guide is shown only when the selected
   // element is actually centered (including when snapping has aligned it).
   ctx.save();ctx.strokeStyle="rgba(52,120,246,.52)";ctx.lineWidth=.5;ctx.setLineDash([2,4]);ctx.beginPath();
   const q=state.quiet*state.narrow*pxmm;
   ctx.moveTo(barBox.x+q,barBox.y-1);ctx.lineTo(barBox.x+q,barBox.y+barBox.h+1);
   ctx.moveTo(barBox.x+barBox.w-q,barBox.y-1);ctx.lineTo(barBox.x+barBox.w-q,barBox.y+barBox.h+1);
   ctx.stroke();
   const active=state.selected==="title"?titleBox:state.selected==="barcode"?barBox:dataBox;
   const centeredX=Math.abs((active.x+active.w/2)-d.w/2)<=1.5;
   const centeredY=Math.abs((active.y+active.h/2)-d.h/2)<=1.5;
   if(centeredX){ctx.strokeStyle="rgba(52,120,246,.7)";ctx.lineWidth=.5;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(Math.round(d.w/2)+.25,0);ctx.lineTo(Math.round(d.w/2)+.25,d.h);ctx.stroke()}
   if(centeredY){ctx.strokeStyle="rgba(52,120,246,.7)";ctx.lineWidth=.5;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(0,Math.round(d.h/2)+.25);ctx.lineTo(d.w,Math.round(d.h/2)+.25);ctx.stroke()}
   // Printable-area boundaries: 12 mm band centered within selected stock.
   ctx.strokeStyle="rgba(220,80,60,.45)";ctx.lineWidth=.5;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(0,printY+.25);ctx.lineTo(d.w,printY+.25);ctx.moveTo(0,printY+printH-.25);ctx.lineTo(d.w,printY+printH-.25);ctx.stroke();
   ctx.restore();
 }
 const box=state.selected==="title"?(titleOutlineBox||titleBox):state.selected==="barcode"?barBox:dataBox;
 if(state.selected){ctx.save();ctx.strokeStyle="#3478f6";ctx.lineWidth=1;ctx.setLineDash([3,2]);ctx.strokeRect(box.x,box.y,box.w,box.h);ctx.setLineDash([]);ctx.fillStyle="#3478f6";ctx.fillRect(box.x+box.w-5,box.y+box.h-5,5,5);ctx.restore()}
 $("sizeReadout").textContent=`${state.tape} MM TAPE × ${state.length} MM LABEL`;$("dotsReadout").textContent=`${d.w} × ${d.h} DOTS · D30 PRINT BAND 96 DOTS`;
 const bounds=[["title",titleBox,state.titleOn],["barcode",barBox,true],["data",dataBox,state.humanOn]].filter(x=>x[2]);
 const overflow=bounds.some(([name,b])=>b.x<0||b.x+b.w>d.w);
 $("warning").textContent=overflow?"Warning: one or more elements extend beyond the 40 mm label length. Printing may cut off content.":"";
 $("warning").style.display=overflow?"block":"none";
 $("darknessVal").textContent=state.darkness+"/8";$("copiesVal").textContent=state.copies;$("centerVal").textContent=Number(state.center).toFixed(1)+" mm";$("barHeightVal").textContent=state.barHeight+" mm";$("textSizeVal").textContent=state.textSize+" dots";$("titleSizeVal").textContent=state.titleSize+" dots";$("narrowVal").textContent=Number(state.narrow).toFixed(3)+" mm";$("quietVal").textContent=state.quiet+" modules";
}
function wrapText(ctx,text,max){const lines=[];for(const paragraph of String(text).split(/\r?\n/)){let words=paragraph.split(/\s+/),line="";for(let w of words){let test=line?line+" "+w:w;if(ctx.measureText(test).width>max&&line){lines.push(line);line=w}else line=test}lines.push(line)}return lines}
function toast(msg){let t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),4500)}
// Restore the default label/canvas configuration without changing printer connection, darkness, copies, or queue.
$("resetCanvasBtn").onclick=()=>{
 Object.assign(state,{tape:14,length:40,data:"PW012345",title:"Property of Fresno Unified School District",titleOn:true,humanOn:true,barHeight:5.2,textSize:21,titleSize:16,narrow:.262,quiet:8,gap:.125,titleX:null,titleY:null,titleW:null,titleH:null,barcodeX:null,barcodeY:null,barcodeW:null,barcodeH:null,dataX:null,dataY:null,dataW:null,dataH:null,selected:"title",snap:true,guides:true});
 syncInputs();
 toast("Canvas restored to default settings.");
};
function syncInputs(){$("data").value=state.data;$("titleText").value=state.title;$("titleOn").checked=state.titleOn;$("humanOn").checked=state.humanOn;["barHeight","textSize","titleSize","narrow","quiet","darkness","copies","center"].forEach(id=>{$(id).value=state[id]});document.querySelectorAll("#tapeChoices button").forEach(b=>b.classList.toggle("selected",+b.dataset.v===state.tape));document.querySelectorAll("#lengthChoices button").forEach(b=>b.classList.toggle("selected",+b.dataset.v===state.length));render()}
["data","titleText"].forEach(id=>$(id).addEventListener("input",e=>{state[id==="data"?"data":"title"]=e.target.value;render()}));
$("titleOn").onchange=e=>{state.titleOn=e.target.checked;render()};$("humanOn").onchange=e=>{state.humanOn=e.target.checked;render()};
[["barHeight","barHeight"],["titleSize","titleSize"],["textSize","textSize"],["narrow","narrow"],["quiet","quiet"],["darkness","darkness"],["copies","copies"],["center","center"]].forEach(([id,key])=>$(id).addEventListener("input",e=>{state[key]=+e.target.value;if(key==="barHeight")state.barcodeH=null;if(key==="titleSize")state.titleH=null;if(key==="textSize")state.dataH=null;render()}));
document.querySelectorAll("#tapeChoices button").forEach(b=>{b.disabled=false;b.title="Preview tape width; D30 print band remains 12 mm";b.onclick=()=>{state.tape=+b.dataset.v;render();document.querySelectorAll("#tapeChoices button").forEach(x=>x.classList.toggle("selected",+x.dataset.v===state.tape))}});
document.querySelectorAll("#lengthChoices button").forEach(b=>{b.disabled=+b.dataset.v!==40;b.title=+b.dataset.v===40?"Configured D30 label length":"Current D30 stock is configured for 40 mm labels";b.onclick=()=>{state.length=40;render();document.querySelectorAll("#lengthChoices button").forEach(x=>x.classList.toggle("selected",+x.dataset.v===40))}});
function cleanCanvas(){const guides=state.guides,selected=state.selected;state.guides=false;state.selected=null;render();const c=$("labelCanvas"),d=dims(),out=document.createElement("canvas");out.width=d.w;out.height=d.h;const ox=out.getContext("2d");ox.imageSmoothingEnabled=false;ox.drawImage(c,0,0,c.width,c.height,0,0,d.w,d.h);const url=out.toDataURL("image/png");state.guides=guides;state.selected=selected;render();return url}
$("pngBtn").onclick=()=>{const a=document.createElement("a");a.download=`StripStudio-${state.data||"label"}.png`;a.href=cleanCanvas();a.click()};
$("addQueue").onclick=()=>{let items=$("queueInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!queue.length){const canvasValue=String(state.data||"").trim();if(canvasValue)queue.push(canvasValue)}queue.push(...items);if(!queue.length){const canvasValue=String(state.data||"").trim();if(canvasValue)queue.push(canvasValue)}drawQueue();$("queueInput").value=""};
$("clearQueue").onclick=()=>{queue=[];drawQueue()};function drawQueue(){$("queueCount").textContent=queue.length+" ITEMS";$("queueList").innerHTML="";queue.forEach((v,i)=>{let li=document.createElement("li");li.textContent=v+" ";let b=document.createElement("button");b.textContent="Remove";b.onclick=()=>{queue.splice(i,1);drawQueue()};li.appendChild(b);$("queueList").appendChild(li)})}
function setupData(){return JSON.stringify(state)}function getSetups(){try{return JSON.parse(localStorage.getItem("stripStudioSetups")||"{}")}catch{return {}}}function refreshSetups(){let s=$("setupList"),v=s.value;s.innerHTML='<option value="">Choose a saved setup…</option>';Object.keys(getSetups()).forEach(n=>{let o=document.createElement("option");o.value=n;o.textContent=n;s.appendChild(o)});s.value=v}
$("saveSetup").onclick=()=>{let n=$("setupName").value.trim();if(!n)return toast("Enter a setup name first.");let all=getSetups();all[n]=JSON.parse(setupData());localStorage.setItem("stripStudioSetups",JSON.stringify(all));refreshSetups();$("setupList").value=n;toast("Setup saved on this device.")};
$("loadSetup").onclick=()=>{let n=$("setupList").value,all=getSetups();if(!n||!all[n])return toast("Choose a saved setup.");Object.assign(state,all[n]);state.tape=[12,14,15].includes(+state.tape)?+state.tape:14;state.length=40;syncInputs();toast("Setup loaded. Label length set to 40 mm; D30 print band remains 12 mm.")};
$("deleteSetup").onclick=()=>{let n=$("setupList").value;if(!n)return;let all=getSetups();delete all[n];localStorage.setItem("stripStudioSetups",JSON.stringify(all));refreshSetups();toast("Setup deleted.")};
function bytes(...a){return new Uint8Array(a)}
function setBluetoothStatus(connected,name=""){ $("bluetoothState").textContent=connected?"CONNECTED":"DISCONNECTED"; $("printerStatus").textContent=connected?"Connected: "+(name||"Phomemo printer"):"Printer disconnected"; $("connectBtn").textContent=connected?"✓ Connected":"♧ Connect"; }
async function connectPrinter(){if(!navigator.bluetooth)throw Error("Web Bluetooth is not available. Use Edge at http://localhost on Windows.");printerDevice=await navigator.bluetooth.requestDevice({filters:[{namePrefix:"D"}],optionalServices:["0000ff00-0000-1000-8000-00805f9b34fb"]});printerDevice.addEventListener("gattserverdisconnected",()=>{printerChar=null;setBluetoothStatus(false)});let server=await printerDevice.gatt.connect();let service=await server.getPrimaryService("0000ff00-0000-1000-8000-00805f9b34fb");printerChar=await service.getCharacteristic("0000ff02-0000-1000-8000-00805f9b34fb");setBluetoothStatus(true,printerDevice.name);toast("Bluetooth connected.")}
$("connectBtn").onclick=async()=>{try{await connectPrinter()}catch(e){toast("Bluetooth connection failed: "+e.message)}};
function canvasToMono(c){let ctx=c.getContext("2d"),im=ctx.getImageData(0,0,c.width,c.height);/* D-series labels are commonly sent rotated 90 degrees: printer-head width becomes the original canvas height. */let outW=c.height,outH=c.width,stride=Math.ceil(outW/8),out=new Uint8Array(stride*outH);for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let i=(y*c.width+x)*4,lum=.299*im.data[i]+.587*im.data[i+1]+.114*im.data[i+2];if(lum<160){let rx=c.height-1-y,ry=x;out[ry*stride+(rx>>3)]|=0x80>>(rx&7)}}return {data:out,widthBytes:stride,height:outH}}
async function writeChunks(data){for(let i=0;i<data.length;i+=180){const part=data.slice(i,i+180);if(printerChar.writeValueWithoutResponse)await printerChar.writeValueWithoutResponse(part);else await printerChar.writeValue(part);await new Promise(r=>setTimeout(r,25))}}
async function printOne(value){
 if(!printerChar)throw Error("Connect to the D30 first.");
 // Render using the same selected-tape coordinates as the preview, then crop
 // the centered 12 mm band bounded by the red horizontal guides. This prevents
 // content from shifting when a 14/15 mm preview is converted to D30 print data.
 const selectedTape=state.tape, selectedLength=state.length;
 state.length=40;
 let old=state.data;state.data=value;render();
 let url=cleanCanvas(),img=new Image();img.src=url;await img.decode();
 const full=document.createElement("canvas");full.width=img.naturalWidth;full.height=img.naturalHeight;
 full.getContext("2d").drawImage(img,0,0);
 const printH=Math.round(12*203/25.4), cropY=Math.round((full.height-printH)/2);
 const temp=document.createElement("canvas");temp.width=full.width;temp.height=printH;
 temp.getContext("2d").drawImage(full,0,cropY,full.width,printH,0,0,full.width,printH);
 // The prior build nudged output right by 2 mm. Shift it 1.5 mm left
 // from that position, leaving a net 0.5 mm rightward correction (about 4 dots).
 const aligned=document.createElement("canvas");aligned.width=temp.width;aligned.height=temp.height;
 const alignedCtx=aligned.getContext("2d");
 // Fill the shifted raster canvas white first. Otherwise the transparent pixels
 // exposed on the left are read as black by canvasToMono and print as a solid bar.
 alignedCtx.fillStyle="#fff";alignedCtx.fillRect(0,0,aligned.width,aligned.height);
 alignedCtx.drawImage(temp,Math.round(0.5*203/25.4),0);
 let m=canvasToMono(aligned);
 if(m.widthBytes!==12||m.height!==320){state.tape=selectedTape;state.length=selectedLength;state.data=old;render();throw Error(`Unexpected D30 raster dimensions ${m.widthBytes*8} x ${m.height}; expected 96 x 320 dots for 12 x 40 mm.`)}
 state.tape=selectedTape;state.length=selectedLength;state.data=old;render();
 // Apply the selected thermal print density before starting the raster job.
 // Phomemo's D-series protocol uses 1F 11 02 NN for the density/energy value.
 // Keep the UI's 1-8 range intact and send the selected value on every print.
 const density=Math.max(1,Math.min(8,Math.round(Number(state.darkness)||6)));
 await writeChunks(bytes(0x1f,0x11,0x02,density));
 // D30 page-init includes the raster command and full 320-line height. Do not
 // send separate GS v 0 commands for chunks: each can be treated as a new label.
 await writeChunks(bytes(0x1f,0x11,0x24,0x00,0x1b,0x40,0x1d,0x76,0x30,0x00,0x0c,0x00,0x40,0x01));
 await writeChunks(m.data);
 await new Promise(r=>setTimeout(r,250));
 await writeChunks(bytes(0x1f,0x11,0x08,0x1f,0x11,0x0e,0x1f,0x11,0x07,0x1f,0x11,0x09));
 state.data=old;render()
}
$("printBtn").onclick=async()=>{try{const warning=$("warning");if(warning.style.display!=="none"&&warning.textContent.trim()&&!confirm(warning.textContent+" Continue printing?"))return;let list=queue.length?queue.slice():[state.data];for(let v of list)for(let i=0;i<state.copies;i++){await printOne(v)}toast("Print data sent. Check physical output.")}catch(e){toast("Print failed: "+(e.message||String(e)))}};
const c=$("labelCanvas");
function elementBoxes(){const d=dims(),pxmm=203/25.4,pad=state.quiet*state.narrow*pxmm,th=state.titleH??(state.titleSize*1.2+4),bh=state.barHeight*pxmm,dh=state.dataH??(state.textSize*1.3);return {title:{x:state.titleX??4,y:state.titleY??2,w:state.titleW??d.w-8,h:th},barcode:{x:state.barcodeX??pad,y:state.barcodeY??(state.titleOn?th+2:4),w:state.barcodeW??d.w-2*pad,h:state.barcodeH??bh},data:{x:state.dataX??4,y:state.dataY??((state.barcodeY??(state.titleOn?th+2:4))+bh+state.gap*pxmm),w:state.dataW??d.w-8,h:dh}}}
function hitTest(x,y){
 const boxes=elementBoxes();
 const names=["data","barcode","title"].filter(name=>name!=="title"||state.titleOn);
 const candidates=[];
 // Prefer the actual element under the pointer before considering any expanded grab zone.
 // This prevents the subtitle's larger drag target from stealing clicks meant for the
 // barcode or title.
 for(const name of names){
  const b=boxes[name];
  const inside=x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
  if(!inside)continue;
  const cx=b.x+b.w/2,cy=b.y+b.h/2;
  const score=Math.hypot((x-cx)/Math.max(1,b.w),(y-cy)/Math.max(1,b.h));
  candidates.push({name,box:b,score,inside:true});
 }
 let chosen=null;
 if(candidates.length){
  candidates.sort((a,b)=>a.score-b.score);
  chosen=candidates[0];
 }else{
  // A modest expanded target helps grab small subtitle text without crossing into
  // neighboring barcode/title controls. Expanded targets are only used if no real
  // element box is directly under the pointer.
  for(const name of names){
   const b=boxes[name],grab=name==="data"?14:name==="barcode"?7:7;
   if(x<b.x-grab||x>b.x+b.w+grab||y<b.y-grab||y>b.y+b.h+grab)continue;
   const dx=Math.max(b.x-x,0,x-(b.x+b.w));
   const dy=Math.max(b.y-y,0,y-(b.y+b.h));
   const score=Math.hypot(dx,dy);
   if(!chosen||score<chosen.score)chosen={name,box:b,score,inside:false};
  }
 }
 if(!chosen)return null;
 const {name,box:b}=chosen;
 const handle=name==="data"?8:7;
 const L=Math.abs(x-b.x)<=handle,R=Math.abs(x-(b.x+b.w))<=handle,T=Math.abs(y-b.y)<=handle,B=Math.abs(y-(b.y+b.h))<=handle;
 let mode="move";
 if((L||R)&&(T||B))mode=((T&&L)||(B&&R))?"nwse":"nesw";
 else if(L)mode="ew-left";
 else if(R)mode="ew-right";
 else if(T)mode="ns-top";
 else if(B)mode="ns-bottom";
 return {name,box:b,mode};
}
function editInlineText(name){
 const r=c.getBoundingClientRect(),d=dims(),b=elementBoxes()[name];
 const scaleX=r.width/d.w,scaleY=r.height/d.h;
 const area=document.createElement("textarea");
 const isTitle=name==="title";
 area.value=isTitle?state.title:state.data;
 area.setAttribute("aria-label",isTitle?"Edit title directly on label":"Edit subtitle and barcode data directly on label");
 Object.assign(area.style,{position:"fixed",left:(r.left+b.x*scaleX)+"px",top:(r.top+b.y*scaleY)+"px",width:Math.max(45,b.w*scaleX)+"px",height:Math.max(28,b.h*scaleY)+"px",zIndex:1000,resize:"both",border:"1px solid #3478f6",outline:"2px solid #3478f655",borderRadius:"2px",padding:"1px 3px",margin:"0",background:"#ffffffee",color:"#111",font:"500 "+((isTitle?state.titleSize:state.textSize)*scaleY)+"px Arial,sans-serif",lineHeight:"1.15",textAlign:"center",whiteSpace:"pre-wrap",overflow:"auto"});
 document.body.appendChild(area);area.focus();area.select();
 let done=false;const original=area.value;
 const apply=value=>{if(isTitle){state.title=value;$("titleText").value=value}else{state.data=value;$("data").value=value}render()};
 const finish=save=>{if(done)return;done=true;if(save)apply(area.value);else apply(original);area.remove();render()};
 // Keep the subtitle/barcode payload to a single line. Barcode scanners commonly
 // send Enter (or Tab) as a suffix; treat that as scan completion, not barcode data.
 area.addEventListener("input",()=>{
  if(!isTitle){
   const start=area.selectionStart,end=area.selectionEnd;
   const cleaned=area.value.replace(/[\r\n\t]/g,"");
   if(cleaned!==area.value){area.value=cleaned;const pos=Math.min(start,cleaned.length);area.setSelectionRange(pos,Math.min(end,cleaned.length));}
  }
  apply(area.value);
  if(isTitle){
   // Keep the inline editor tall enough for explicit line breaks so Enter visibly
   // creates a second title line while the selection outline updates live.
   const lineCount=Math.max(1,area.value.split(/\r?\n/).length);
   area.style.height=Math.max(28,(lineCount*state.titleSize*1.4+8)*scaleY)+"px";
  }
 });
 area.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();finish(false)}
  else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();finish(true)}
  else if(!isTitle&&e.key==="Enter"){e.preventDefault();finish(true)}
  else if(!isTitle&&e.key==="Tab"){e.preventDefault();finish(true)}
 });
 area.addEventListener("blur",()=>finish(true));
}

c.addEventListener("pointerdown",e=>{
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*dims().w/r.width,y=(e.clientY-r.top)*dims().h/r.height,hit=hitTest(x,y);
 if(!hit){state.selected=null;render();return}
 state.selected=hit.name;
 drag={name:hit.name,x,y,box:{...hit.box},mode:hit.mode};
 c.setPointerCapture(e.pointerId);render();
});
c.addEventListener("pointermove",e=>{
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*dims().w/r.width,y=(e.clientY-r.top)*dims().h/r.height;
 if(!drag){
  const hit=hitTest(x,y);c.classList.remove("cursor-move","cursor-resize","cursor-ew","cursor-ns","cursor-nesw");
  if(hit){if(hit.mode==="move")c.classList.add("cursor-move");else if(hit.mode.startsWith("ew"))c.classList.add("cursor-ew");else if(hit.mode.startsWith("ns"))c.classList.add("cursor-ns");else if(hit.mode==="nesw")c.classList.add("cursor-nesw");else c.classList.add("cursor-resize")}
  return;
 }
 const dx=x-drag.x,dy=y-drag.y,n=drag.name,b=drag.box,mode=drag.mode;
 let nx=b.x,ny=b.y,nw=b.w,nh=b.h;
 if(mode==="move"){nx=b.x+dx;ny=b.y+dy}
 else {
  if(mode==="ew-left"){nx=b.x+dx;nw=b.w-dx}
  else if(mode==="ew-right")nw=b.w+dx;
  else if(mode==="ns-top"){ny=b.y+dy;nh=b.h-dy}
  else if(mode==="ns-bottom")nh=b.h+dy;
  else {
   const left=(mode==="nwse"&&drag.x<=b.x+7)||(mode==="nesw"&&drag.x<=b.x+7);
   const top=drag.y<=b.y+7;
   if(left){nx=b.x+dx;nw=b.w-dx}else nw=b.w+dx;
   if(top){ny=b.y+dy;nh=b.h-dy}else nh=b.h+dy;
  }
 }
 if(state.snap&&mode==="move"){if(Math.abs(nx+nw/2-dims().w/2)<5)nx=dims().w/2-nw/2;if(Math.abs(ny+nh/2-dims().h/2)<5)ny=dims().h/2-nh/2}
 state[n+"X"]=Math.max(-dims().w,Math.min(dims().w*2,nx));state[n+"Y"]=Math.max(-dims().h,Math.min(dims().h*2,ny));state[n+"W"]=Math.max(8,Math.min(dims().w*3,nw));state[n+"H"]=Math.max(8,Math.min(dims().h*3,nh));
 if(mode!=="move"&&n==="title"&&(mode.startsWith("ns")||mode==="nwse"||mode==="nesw"))state.titleSize=Math.max(7,Math.min(40,Math.round(nh/1.3)));
 if(mode!=="move"&&n==="data"&&(mode.startsWith("ns")||mode==="nwse"||mode==="nesw"))state.textSize=Math.max(7,Math.min(32,Math.round(nh/1.3)));
 if(mode!=="move"&&n==="barcode"){const pxmm=203/25.4,seq=code128Patterns(state.data||" "),modules=state.quiet*2+seq.flat().reduce((a,b)=>a+b,0);if(mode.startsWith("ew")||mode==="nwse"||mode==="nesw")state.narrow=Math.max(.15,Math.min(.8,(nw/modules)/pxmm));if(mode.startsWith("ns")||mode==="nwse"||mode==="nesw")state.barHeight=Math.max(1,Math.min(10,nh/pxmm))}
 render();
});
c.addEventListener("pointerup",()=>{drag=null});
c.addEventListener("dblclick",e=>{
 const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*dims().w/r.width,y=(e.clientY-r.top)*dims().h/r.height,hit=hitTest(x,y);
 if(hit?.name==="title")editInlineText("title");
 else if(hit?.name==="data")editInlineText("data");
 else if(hit?.name==="barcode")toast("Barcode bars are generated from the Barcode Data field.");
});
refreshSetups();render();
