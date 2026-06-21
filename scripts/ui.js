/* Navigazione di base delle schermate demo. */
(function(){
            function fit(){ var f=document.getElementById('phone-frame'); if(!f) return; var w=f.clientWidth; if(w>0) f.style.setProperty('--app-scale',(w/340).toFixed(4)); }
            var f=document.getElementById('phone-frame');
            if(f){ fit(); window.addEventListener('resize',fit); if(window.ResizeObserver){ new ResizeObserver(fit).observe(f); } if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(fit); } }
            window.openSubScreen=function(id){ var fr=document.getElementById('phone-frame'); if(!fr) return; fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); var t=document.getElementById(id); if(t){ t.classList.add('active'); var sc=t.querySelector('.fp-scroll'); if(sc) sc.scrollTop=0; } };
            window.fpBack=function(back){ var fr=document.getElementById('phone-frame'); if(!fr) return; fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); if(back && typeof window.switchTab==='function'){ window.switchTab(back); } else { var hm=document.getElementById('screen-home'); if(hm) hm.classList.add('active'); } };
            window.fpTab=function(tab){ var fr=document.getElementById('phone-frame'); if(fr) fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); if(typeof window.switchTab==='function') window.switchTab(tab); };

            
})();

/* Tab, FAB assistente e pulsanti di aggiunta. */
(function(){
      var CTX={
        'screen-home':'home','screen-health':'health','screen-dashboard':'dash',
        'screen-activities':'activities','screen-profile':'profile','screen-places':'places',
        'screen-m-activity':'m-activity','screen-m-temp':'m-temp','screen-m-resp':'m-resp','screen-m-energy':'m-energy',
        'screen-diary':'diary','screen-records':'records',
        'screen-alert-activity':'alert-activity','screen-alert-resp':'alert-resp','screen-alert-skin':'alert-skin',
        'screen-place-hazard':'place-hazard','screen-place-park':'place-park',
        'screen-place-owners':'place-owners','screen-place-vet':'place-vet','screen-place-add':'place-add'
      };
      function setup(){
        var frame=document.getElementById('phone-frame');
        if(!frame) return;
        var mapCredit=frame.querySelector('.places-credit');
        if(mapCredit){
          mapCredit.innerHTML='<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> · demo';
        }
        /* 1. rimuovi la tab "Assistente" da tutte le footer -> barra a 3 voci */
        frame.querySelectorAll('.fp-footer .fp-tab').forEach(function(btn){
          var oc=btn.getAttribute('onclick')||'';
          if(btn.getAttribute('data-demo-tab')==='chat' || oc.indexOf("'chat'")>-1) btn.remove();
        });
        /* 1b. tab "Luoghi" + ordine barra: Home · Alert · Luoghi · Salute */
        frame.querySelectorAll('.fp-footer').forEach(function(ft){
          if(!ft.querySelector('[data-tab="places"]')){
            var b=document.createElement('button');
            b.type='button'; b.className='fp-tab'; b.setAttribute('data-tab','places');
            b.innerHTML='<span class="fp-tab-ic"><span class="material-symbols-outlined">map</span></span><span class="fp-tab-lbl">Luoghi</span>';
            b.addEventListener('click',function(){ window.fpGo('places'); });
            ft.appendChild(b);
          }
          function byLbl(t){ return [].slice.call(ft.querySelectorAll('.fp-tab')).find(function(x){ var l=x.querySelector('.fp-tab-lbl'); return l && l.textContent.trim()===t; }); }
          ['Home','Salute','Luoghi','Alert'].forEach(function(t){ var x=byLbl(t); if(x) ft.appendChild(x); });
        });
        /* 2. rimuovi i pulsanti "Chiedi all'assist." in-content (ora ridondanti col FAB) */
        frame.querySelectorAll('.fp-asbtn').forEach(function(b){ var p=b.parentElement; (p||b).remove(); });
        /* 3. inietta il FAB su ogni schermata (tranne l'assistente stesso) */
        frame.querySelectorAll('.phone-screen').forEach(function(scr){
          var key=CTX[scr.id]; if(!key) return;
          var canvas=scr.querySelector('.fp-canvas'); if(!canvas) return;
          var fab=document.createElement('button');
          fab.type='button'; fab.className='fp-fab'; fab.setAttribute('aria-label','Chiedi all\u2019assistente');
          fab.innerHTML='<span class="material-symbols-outlined">volunteer_activism</span><span class="fp-fab-lbl">Chiedi all\u2019assist.</span>';
          fab.addEventListener('click',function(){ if(typeof window.openAssistant==='function') window.openAssistant(key); });
          canvas.appendChild(fab);
          var sc=scr.querySelector('.fp-scroll') || scr.querySelector('.places-sheet');
          if(sc){
            if(sc.classList.contains('fp-scroll')) sc.style.paddingBottom='82px';
            sc.addEventListener('scroll',function(){
              if(sc.scrollTop>8) fab.classList.add('fp-fab--mini'); else fab.classList.remove('fp-fab--mini');
            },{passive:true});
          }
        });
        /* 3b. pulsante "+" flottante sopra il FAB assistente, sulle schede con azione di aggiunta */
        var ADD={
          'screen-activities':null,
          'screen-diary':null,
          'screen-records':null,
          'screen-places':function(){ if(typeof window.openSubScreen==='function') window.openSubScreen('screen-place-add'); }
        };
        frame.querySelectorAll('.phone-screen').forEach(function(scr){
          if(!(scr.id in ADD)) return;
          var canvas=scr.querySelector('.fp-canvas'); if(!canvas) return;
          if(canvas.querySelector('.fp-add-fab')) return;
          var add=document.createElement('button');
          add.type='button'; add.className='fp-add-fab'; add.setAttribute('aria-label','Aggiungi');
          add.innerHTML='<span class="material-symbols-outlined">add</span>';
          if(ADD[scr.id]) add.addEventListener('click',ADD[scr.id]);
          canvas.appendChild(add);
        });
      }
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup); else setup();

})();
