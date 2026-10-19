// EDIT MAP DATA: Star areas, coordinates, and clues come from data/star_locations.txt.
// EDIT MAP BEHAVIOR: Zoom limits, coordinate conversion, filtering, and drag controls are in this file.
(function(){
  const viewer=document.getElementById('map-viewer');
  const stage=document.getElementById('map-stage');
  const markersLayer=document.getElementById('map-markers');
  const loading=document.getElementById('map-loading');
  const count=document.getElementById('map-count');
  const search=document.getElementById('star-search');
  const regionSelect=document.getElementById('star-region');
  const selected=document.getElementById('map-selected');
  const tooltip=document.getElementById('map-tooltip');
  const tooltipArea=document.getElementById('map-tooltip-area');
  const tooltipCoordinates=document.getElementById('map-tooltip-coordinates');
  const tooltipClue=document.getElementById('map-tooltip-clue');
  const zoomIn=document.getElementById('map-zoom-in');
  const zoomOut=document.getElementById('map-zoom-out');
  const reset=document.getElementById('map-reset');
  const mapSize=1024;
  // Jorvik's in-game world map uses a 410 by 410 coordinate space.
  const coordinateMaximum=410;
  const cityAreas=new Set(["Aideen's Plaza","Governor's Fall","Jorvik City Mall","Jorvik City Harbor (Pier 13)"]);
  let stars=[];
  let markerButtons=[];
  let fitScale=1;
  let zoom=1;
  let offsetX=0;
  let offsetY=0;
  let dragging=false;
  let dragStartX=0;
  let dragStartY=0;
  let dragOffsetX=0;
  let dragOffsetY=0;

  function coordinateMatch(line){
    return line.match(/^\s*(?:\d+\s+)?X\s*[:;]?\s*(\d+)\s*,?\s*Y\s*[:;]?\s*(\d+)\s*(.*)$/i);
  }

  function nextMeaningfulLine(lines,index){
    for(let i=index+1;i<lines.length;i++)if(lines[i].trim())return lines[i].trim();
    return '';
  }

  function isAreaHeading(lines,index){
    const line=lines[index].trim();
    if(!line||line.length>55||/[.!?:]$/.test(line)||coordinateMatch(line)||/^see notes/i.test(line))return false;
    const next=nextMeaningfulLine(lines,index);
    return Boolean(coordinateMatch(next)||/^see notes/i.test(next));
  }

  function parseStarLocations(text){
    const lines=text.replace(/\r/g,'').split('\n');
    const parsed=[];
    let area='Unsorted';
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      if(!line)continue;
      if(isAreaHeading(lines,i)){
        area=line;
        continue;
      }
      const match=coordinateMatch(line);
      if(!match)continue;
      const descriptionParts=[];
      if(match[3].trim())descriptionParts.push(match[3].trim());
      let nextIndex=i+1;
      while(nextIndex<lines.length){
        const nextLine=lines[nextIndex].trim();
        if(coordinateMatch(nextLine)||isAreaHeading(lines,nextIndex))break;
        if(nextLine&&!/^see notes/i.test(nextLine))descriptionParts.push(nextLine);
        nextIndex++;
      }
      parsed.push({
        area,
        x:Number(match[1]),
        y:Number(match[2]),
        description:descriptionParts.join(' ')||'No additional clue was included.'
      });
      i=nextIndex-1;
    }
    return parsed;
  }

  function updateTransform(){
    const renderedScale=fitScale*zoom;
    stage.style.transform=`translate(${offsetX}px,${offsetY}px) scale(${renderedScale})`;
    stage.style.setProperty('--marker-counter-scale',String(1/renderedScale));
  }

  function constrainPan(){
    const width=mapSize*fitScale*zoom;
    const height=mapSize*fitScale*zoom;
    offsetX=width<=viewer.clientWidth?(viewer.clientWidth-width)/2:Math.min(0,Math.max(viewer.clientWidth-width,offsetX));
    offsetY=height<=viewer.clientHeight?(viewer.clientHeight-height)/2:Math.min(0,Math.max(viewer.clientHeight-height,offsetY));
  }

  function resetMapView(){
    if(!viewer.clientWidth||!viewer.clientHeight)return;
    fitScale=Math.min(viewer.clientWidth/mapSize,viewer.clientHeight/mapSize);
    zoom=1;
    offsetX=(viewer.clientWidth-mapSize*fitScale)/2;
    offsetY=(viewer.clientHeight-mapSize*fitScale)/2;
    updateTransform();
  }

  function zoomAt(newZoom,screenX,screenY){
    newZoom=Math.min(6,Math.max(1,newZoom));
    const oldScale=fitScale*zoom;
    const worldX=(screenX-offsetX)/oldScale;
    const worldY=(screenY-offsetY)/oldScale;
    zoom=newZoom;
    const newScale=fitScale*zoom;
    offsetX=screenX-worldX*newScale;
    offsetY=screenY-worldY*newScale;
    constrainPan();
    updateTransform();
  }

  function showStar(star,button){
    markerButtons.forEach(marker=>marker.classList.toggle('is-selected',marker===button));
    selected.replaceChildren();
    const label=document.createElement('p');
    label.className='eyebrow';
    label.textContent='Selected star';
    const title=document.createElement('h3');
    title.textContent=star.area;
    const coordinates=document.createElement('span');
    coordinates.className='map-selected-coordinates';
    coordinates.textContent=`X: ${star.x} · Y: ${star.y}`;
    const clue=document.createElement('p');
    clue.textContent=star.description;
    selected.append(label,title,coordinates,clue);
  }

  function positionTooltip(clientX,clientY){
    const viewerRect=viewer.getBoundingClientRect();
    const gap=14;
    const edge=10;
    let left=clientX-viewerRect.left+gap;
    let top=clientY-viewerRect.top+gap;
    if(left+tooltip.offsetWidth>viewer.clientWidth-edge)left=clientX-viewerRect.left-tooltip.offsetWidth-gap;
    if(top+tooltip.offsetHeight>viewer.clientHeight-edge)top=clientY-viewerRect.top-tooltip.offsetHeight-gap;
    tooltip.style.left=`${Math.max(edge,left)}px`;
    tooltip.style.top=`${Math.max(edge,top)}px`;
  }

  function showTooltip(star,clientX,clientY){
    tooltipArea.textContent=star.area;
    tooltipCoordinates.textContent=`X: ${star.x} · Y: ${star.y}`;
    tooltipClue.textContent=star.description;
    tooltip.hidden=false;
    positionTooltip(clientX,clientY);
  }

  function hideTooltip(){
    tooltip.hidden=true;
  }

  function createMarkers(){
    markersLayer.replaceChildren();
    markerButtons=[];
    stars.forEach((star,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='map-marker';
      button.style.left=`${Math.min(99.2,Math.max(.8,star.x/coordinateMaximum*100))}%`;
      button.style.top=`${Math.min(99.2,Math.max(.8,star.y/coordinateMaximum*100))}%`;
      button.setAttribute('aria-label',`${star.area}, star at X ${star.x}, Y ${star.y}`);
      button.setAttribute('aria-describedby','map-tooltip');
      button.dataset.index=String(index);
      const icon=document.createElement('img');
      icon.src='assets/star-marker.png';
      icon.alt='';
      button.append(icon);
      button.addEventListener('pointerdown',event=>event.stopPropagation());
      button.addEventListener('pointerenter',event=>showTooltip(star,event.clientX,event.clientY));
      button.addEventListener('pointermove',event=>positionTooltip(event.clientX,event.clientY));
      button.addEventListener('pointerleave',hideTooltip);
      button.addEventListener('focus',()=>{const rect=button.getBoundingClientRect();showTooltip(star,rect.right,rect.top)});
      button.addEventListener('blur',hideTooltip);
      button.addEventListener('click',()=>showStar(star,button));
      markerButtons.push(button);
      markersLayer.append(button);
    });
  }

  function filterMarkers(){
    hideTooltip();
    const query=search.value.trim().toLocaleLowerCase();
    const area=regionSelect.value;
    let visible=0;
    stars.forEach((star,index)=>{
      const haystack=`${star.area} ${star.x} ${star.y} ${star.description}`.toLocaleLowerCase();
      const matches=(!area||star.area===area)&&(!query||haystack.includes(query));
      markerButtons[index].hidden=!matches;
      if(matches)visible++;
    });
    count.textContent=`${visible} star${visible===1?'':'s'}`;
  }

  function populateRegions(){
    const areas=[...new Set(stars.map(star=>star.area))].sort((a,b)=>a.localeCompare(b));
    areas.forEach(area=>regionSelect.add(new Option(area,area)));
  }

  viewer.addEventListener('wheel',event=>{
    event.preventDefault();
    hideTooltip();
    const rect=viewer.getBoundingClientRect();
    const factor=event.deltaY<0?1.16:.86;
    zoomAt(zoom*factor,event.clientX-rect.left,event.clientY-rect.top);
  },{passive:false});

  viewer.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    hideTooltip();
    dragging=true;
    dragStartX=event.clientX;
    dragStartY=event.clientY;
    dragOffsetX=offsetX;
    dragOffsetY=offsetY;
    viewer.classList.add('is-dragging');
    viewer.setPointerCapture(event.pointerId);
  });

  viewer.addEventListener('pointermove',event=>{
    if(!dragging)return;
    offsetX=dragOffsetX+event.clientX-dragStartX;
    offsetY=dragOffsetY+event.clientY-dragStartY;
    constrainPan();
    updateTransform();
  });

  function stopDragging(event){
    if(!dragging)return;
    dragging=false;
    viewer.classList.remove('is-dragging');
    if(viewer.hasPointerCapture(event.pointerId))viewer.releasePointerCapture(event.pointerId);
  }

  viewer.addEventListener('pointerup',stopDragging);
  viewer.addEventListener('pointercancel',stopDragging);
  viewer.addEventListener('keydown',event=>{
    if(event.key==='+'||event.key==='=')zoomAt(zoom*1.2,viewer.clientWidth/2,viewer.clientHeight/2);
    if(event.key==='-')zoomAt(zoom/1.2,viewer.clientWidth/2,viewer.clientHeight/2);
    if(event.key==='0')resetMapView();
  });
  zoomIn.addEventListener('click',()=>zoomAt(zoom*1.25,viewer.clientWidth/2,viewer.clientHeight/2));
  zoomOut.addEventListener('click',()=>zoomAt(zoom/1.25,viewer.clientWidth/2,viewer.clientHeight/2));
  reset.addEventListener('click',resetMapView);
  search.addEventListener('input',filterMarkers);
  regionSelect.addEventListener('change',filterMarkers);
  window.addEventListener('resize',()=>{if(location.hash==='#map')resetMapView()});
  window.addEventListener('hashchange',()=>{if(location.hash==='#map')requestAnimationFrame(resetMapView)});

  fetch('data/star_locations.txt')
    .then(response=>{if(!response.ok)throw Error('Star location file could not be loaded');return response.text()})
    .then(text=>{
      stars=parseStarLocations(text).filter(star=>!cityAreas.has(star.area));
      createMarkers();
      populateRegions();
      filterMarkers();
      loading.hidden=true;
      if(location.hash==='#map')requestAnimationFrame(resetMapView);
    })
    .catch(()=>{
      loading.textContent='The star locations could not be loaded. Open the site through GitHub Pages or a local web server.';
      loading.classList.add('is-error');
      count.textContent='Unavailable';
    });
})();
