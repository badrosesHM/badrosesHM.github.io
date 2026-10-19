// SCHEDULE MENU: Change the dropdown behavior here.
(()=>{
  const button=document.getElementById('schedule-menu-button');
  const menu=document.getElementById('schedule-menu');
  if(!button||!menu)return;

  function closeMenu(){
    button.setAttribute('aria-expanded','false');
    menu.hidden=true;
  }

  function positionMenu(){
    const rect=button.getBoundingClientRect();
    const width=menu.offsetWidth||205;
    menu.style.top=`${Math.round(rect.bottom+6)}px`;
    menu.style.left=`${Math.round(Math.max(12,Math.min(rect.left,window.innerWidth-width-12)))}px`;
  }

  function openMenu(){
    menu.hidden=false;
    button.setAttribute('aria-expanded','true');
    positionMenu();
  }

  function updateActiveState(){
    const route=location.hash.slice(1);
    if(route==='spirit'||route==='championship')button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }

  button.addEventListener('click',()=>{
    if(menu.hidden)openMenu();
    else closeMenu();
  });
  menu.addEventListener('click',event=>{
    if(event.target.closest('a'))closeMenu();
  });
  document.addEventListener('click',event=>{
    if(!event.target.closest('.schedule-dropdown'))closeMenu();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      closeMenu();
      button.focus();
    }
  });
  window.addEventListener('resize',closeMenu);
  window.addEventListener('scroll',closeMenu,{passive:true});
  window.addEventListener('hashchange',updateActiveState);
  updateActiveState();
})();
