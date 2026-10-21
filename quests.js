// QUEST CATALOG: Scrolls catalog buttons to their guide without changing the site route.
document.querySelectorAll('[data-quest-target]').forEach(button=>{
  button.addEventListener('click',()=>{
    const target=document.getElementById(button.dataset.questTarget);
    if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
