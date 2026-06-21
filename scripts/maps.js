/* Mappe OpenStreetMap statiche della demo. */
(function(){
/* ===== Luoghi: navigazione + mappa OpenStreetMap (Leaflet) ===== */
      window.fpGo=function(tab){
        var fr=document.getElementById('phone-frame'); if(!fr) return;
        if(tab==='places'){ window.openPlaces(); return; }
        fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); });
        if(typeof window.switchTab==='function') window.switchTab(tab);
      };
      window.openPlaces=function(){
        var fr=document.getElementById('phone-frame'); if(!fr) return;
        fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); });
        var p=document.getElementById('screen-places'); if(p) p.classList.add('active');
        initPlacesMap();
      };
      var _placesMap=null, _layers={};
      function pinIcon(name,color){ return L.divIcon({className:'',iconSize:[30,42],iconAnchor:[15,40],html:'<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:'+color+';transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 7px rgba(40,30,15,.32);"><span class="material-symbols-outlined" style="transform:rotate(45deg);font-size:17px;color:#fff;font-variation-settings:&apos;FILL&apos; 1;">'+name+'</span></div>'}); }
      function ownerIcon(n){ var c = n>1 ? '<span style="position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;border-radius:9px;background:#2f2b24;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #fff;font-family:Nunito,sans-serif;">'+n+'</span>' : ''; return L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div style="position:relative;width:24px;height:24px;border-radius:50%;background:#5e7350;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(40,30,15,.25);"><span class="material-symbols-outlined" style="font-size:14px;color:#fff;font-variation-settings:&apos;FILL&apos; 1;">pets</span>'+c+'</div>'}); }
      function meIcon(){ return L.divIcon({className:'',iconSize:[18,18],iconAnchor:[9,9],html:'<div style="width:16px;height:16px;border-radius:50%;background:#3f6f8f;border:3px solid #fff;box-shadow:0 0 0 6px rgba(63,111,143,.18),0 1px 4px rgba(0,0,0,.3);"></div>'}); }
      function showMapFallback(el){
        if(!el||el.querySelector('.map-fallback')) return;
        el.style.position='relative';
        var message=document.createElement('div');
        message.className='map-fallback';
        message.textContent='La mappa non è disponibile. Controlla la connessione e ricarica la pagina.';
        el.appendChild(message);
      }
      function initPlacesMap(){
        var el=document.getElementById('places-map'); if(!el) return;
        if(_placesMap){ setTimeout(function(){ _placesMap.invalidateSize(); },90); return; }
        if(!window.L){ showMapFallback(el); return; }
        var center=[45.47235,9.17560];
        _placesMap=L.map(el,{zoomControl:false,attributionControl:false,scrollWheelZoom:false}).setView(center,15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,detectRetina:true}).addTo(_placesMap);
        L.marker(center,{icon:meIcon()}).addTo(_placesMap);
        _layers.owners=L.layerGroup().addTo(_placesMap);
        _layers.parks=L.layerGroup().addTo(_placesMap);
        _layers.hazard=L.layerGroup().addTo(_placesMap);
        [[45.4733,9.1738,1],[45.4707,9.1789,3],[45.4739,9.1772,1]].forEach(function(o){
          L.circle([o[0],o[1]],{radius:65,color:'#5e7350',weight:1.5,dashArray:'4 4',fillColor:'#5e7350',fillOpacity:0.12}).addTo(_layers.owners);
          L.marker([o[0],o[1]],{icon:ownerIcon(o[2])}).addTo(_layers.owners).on('click',function(){ window.openSubScreen('screen-place-owners'); });
        });
        L.marker([45.4727,9.1719],{icon:pinIcon('park','#5e7350')}).addTo(_layers.parks).on('click',function(){ window.openSubScreen('screen-place-park'); });
        L.marker([45.4711,9.1771],{icon:pinIcon('medical_services','#6a5a8f')}).addTo(_layers.parks).on('click',function(){ window.openSubScreen('screen-place-vet'); });
        L.marker([45.4722,9.1746],{icon:pinIcon('warning','#c2552f')}).addTo(_layers.hazard).on('click',function(){ window.openSubScreen('screen-place-hazard'); });
        L.marker([45.4716,9.1783],{icon:pinIcon('priority_high','#cf8a3c')}).addTo(_layers.hazard).on('click',function(){ window.openSubScreen('screen-place-hazard'); });
        setTimeout(function(){ _placesMap.invalidateSize(); },90);
      }
      window.placesFilter=function(cat,btn){
        var bar=btn.parentElement;
        bar.querySelectorAll('.pchip').forEach(function(c){ c.className='pchip pchip-off'; });
        btn.className='pchip pchip-on';
        if(!_placesMap) return;
        function set(layer,on){ if(!layer) return; if(on){ if(!_placesMap.hasLayer(layer)) layer.addTo(_placesMap); } else { if(_placesMap.hasLayer(layer)) _placesMap.removeLayer(layer); } }
        set(_layers.owners, cat==='all'||cat==='owners');
        set(_layers.parks, cat==='all'||cat==='parks');
        set(_layers.hazard, cat==='all'||cat==='hazard');
      };
      /* Mappa live nella sezione Luoghi della landing (stesso OSM + marker dell'app) */
      var _luoghiLandingMap=null;
      function initLuoghiLandingMap(){
        var el=document.getElementById('luoghi-landing-map'); if(!el) return;
        if(!window.L){ showMapFallback(el); return; }
        if(_luoghiLandingMap){ _luoghiLandingMap.invalidateSize(); return; }
        var center=[45.47235,9.17560];
        _luoghiLandingMap=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false}).setView(center,15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,detectRetina:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · dati demo'}).addTo(_luoghiLandingMap);
        L.marker(center,{icon:meIcon()}).addTo(_luoghiLandingMap);
        [[45.4733,9.1738,1],[45.4707,9.1789,3],[45.4739,9.1772,1]].forEach(function(o){
          L.circle([o[0],o[1]],{radius:65,color:'#5e7350',weight:1.5,dashArray:'4 4',fillColor:'#5e7350',fillOpacity:0.12}).addTo(_luoghiLandingMap);
          L.marker([o[0],o[1]],{icon:ownerIcon(o[2])}).addTo(_luoghiLandingMap);
        });
        L.marker([45.4727,9.1719],{icon:pinIcon('park','#5e7350')}).addTo(_luoghiLandingMap);
        L.marker([45.4711,9.1771],{icon:pinIcon('medical_services','#6a5a8f')}).addTo(_luoghiLandingMap);
        L.marker([45.4722,9.1746],{icon:pinIcon('warning','#c2552f')}).addTo(_luoghiLandingMap);
        L.marker([45.4716,9.1783],{icon:pinIcon('priority_high','#cf8a3c')}).addTo(_luoghiLandingMap);
        setTimeout(function(){ _luoghiLandingMap.invalidateSize(); },140);
      }
if(document.readyState==='complete'){ try{ initLuoghiLandingMap(); }catch(e){} }
else window.addEventListener('load',function(){ try{ initLuoghiLandingMap(); }catch(e){} });
})();
