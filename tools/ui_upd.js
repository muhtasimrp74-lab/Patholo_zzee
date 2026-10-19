
function updRings(){document.querySelectorAll('.ring').forEach(r=>{const v=parseFloat(r.style.getPropertyValue('--p'))||0;r.classList.toggle('hi',v>=82);r.classList.toggle('z',v<=0)})}
(function(){const p0=prog;prog=function(){p0();updRings()}})();updRings();
