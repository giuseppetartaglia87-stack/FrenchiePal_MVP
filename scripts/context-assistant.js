/* Assistente contestuale FrenchiePal v4. Backend: /api/chat. */
(function(){
    var ASSIST=window.FrenchiePalAssistantContexts||{};
            function _esc(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML.replace(/\n/g,"<br>"); }
            function _bubble(text,who){ var d=document.createElement("div"); if(who==="user"){ d.className="flex justify-end"; d.innerHTML='<div class="chat-bubble-user">'+text+'</div>'; } else { d.innerHTML='<div class="chat-bubble-bot">'+text+'</div>'; } return d; }
            function _scrollBottom(){ var sc=document.querySelector("#screen-assist-ctx .fp-scroll"); if(sc) sc.scrollTop=sc.scrollHeight; }
            function _aiReply(key,question,curated){ return _aiReplyV4(key,question,curated); }
            window.openAssistant=function(key){ var c=ASSIST[key]; if(!c) return; var act=document.querySelector("#phone-frame .phone-screen.active"); window._assistOrigin=act?act.id:null; window._assistKey=key; window._assistMsgs=[{r:"a",t:c.greeting}]; var b=document.getElementById("assist-ctx-banner"); b.innerHTML='<span class="material-symbols-outlined" style="font-size:19px;color:#5e7350;flex:none;font-variation-settings:&apos;FILL&apos; 1;">insights</span><div><div style="font-size:8px;font-weight:800;letter-spacing:.06em;color:#5e7350;text-transform:uppercase;">Sta assistendo su</div><div style="font-size:12.5px;font-weight:700;color:#3f4a36;">'+c.ctx+'</div></div>'; var log=document.getElementById("assist-ctx-log"); log.innerHTML=""; log.appendChild(_bubble(c.greeting,"bot")); var sg=document.createElement("div"); sg.id="assist-ctx-sugg"; sg.style.cssText="display:flex;flex-direction:column;gap:9px;margin-top:2px;"; c.q.forEach(function(qq,i){ var btn=document.createElement("button"); btn.type="button"; btn.style.cssText="display:flex;align-items:center;gap:10px;border:1px solid #e6dcc8;border-radius:14px;padding:11px 13px;font-size:12px;font-weight:600;color:#574f44;background:#fbf9f4;cursor:pointer;text-align:left;font-family:Nunito,sans-serif;"; btn.innerHTML='<span class="material-symbols-outlined" style="font-size:18px;color:#5e7350;flex:none;">help</span><span>'+qq.t+'</span>'; btn.onclick=(function(idx){return function(){ assistAsk(key,idx); };})(i); sg.appendChild(btn); }); log.appendChild(sg); openSubScreen("screen-assist-ctx"); };
            window.assistAsk=function(key,i){ var c=ASSIST[key]; if(!c) return; var log=document.getElementById("assist-ctx-log"); var sg=document.getElementById("assist-ctx-sugg"); if(sg) sg.remove(); log.appendChild(_bubble(c.q[i].t,"user")); _scrollBottom(); window._assistMsgs=window._assistMsgs||[]; window._assistMsgs.push({r:"u",t:c.q[i].t}); _aiReply(key,c.q[i].t,c.q[i].a); };
            window.assistSend=function(){ var inp=document.getElementById("assist-ctx-input"); var v=(inp.value||"").trim(); if(!v) return; var key=window._assistKey; var c=ASSIST[key]||{}; var log=document.getElementById("assist-ctx-log"); var sg=document.getElementById("assist-ctx-sugg"); if(sg) sg.remove(); log.appendChild(_bubble(v,"user")); inp.value=""; _scrollBottom(); window._assistMsgs=window._assistMsgs||[]; window._assistMsgs.push({r:"u",t:v}); _aiReply(key,v,c.fallback||"Osserva l'andamento e parlane col veterinario se la tendenza continua."); };
            window.assistBack=function(){ if(window._assistOrigin){ openSubScreen(window._assistOrigin); } else { fpBack("dash"); } };

            /* Integrazione v4: OpenAI e contesti validati dal backend Vercel. */
            var EXTRA_ASSIST={
              "profile":{ctx:"Profilo · Dati di Enea",greeting:"Sto guardando il profilo di Enea. Posso aiutarti a interpretare i dati della razza e la sua routine.",q:[{t:"Quali dati sono più importanti?"},{t:"Cosa controllo nella routine?"},{t:"Come proteggo la schiena?"}],fallback:"Nel profilo conviene tenere aggiornati peso, sensibilità note, terapie e contatti veterinari."},
              "activities":{ctx:"Attività · Agenda",greeting:"Sto guardando l'agenda di Enea: pappe, uscite e promemoria. Cosa vuoi organizzare meglio?",q:[{t:"La giornata è ben distribuita?"},{t:"Come gestisco le uscite col caldo?"},{t:"Cosa non devo dimenticare?"}],fallback:"Mantieni pappe e uscite regolari, evitando attività intensa nelle ore più calde."},
              "place-hazard":{ctx:"Luoghi · Segnalazione",greeting:"Sto guardando la segnalazione dei vetri rotti in Via Verdi. Posso aiutarti a scegliere come muoverti.",q:[{t:"Come evito il tratto pericoloso?"},{t:"Cosa controllo alle zampe?"},{t:"La segnalazione è in tempo reale?"}],fallback:"La segnalazione è dimostrativa: nella situazione descritta, scegli un percorso alternativo e controlla le zampe."},
              "place-park":{ctx:"Luoghi · Area cani",greeting:"Sto guardando l'area cani del Parco Sempione nella mappa demo. Vuoi capire se è adatta a Enea?",q:[{t:"È una buona scelta oggi?"},{t:"Come gestisco il caldo?"},{t:"Che giochi sono più sicuri?"}],fallback:"Nella demo l'area è recintata, con acqua e ombra; per Enea meglio attività tranquilla e senza salti."},
              "place-owners":{ctx:"Luoghi · Proprietari vicini",greeting:"Sto guardando i proprietari di Frenchie vicini nella demo. Posso aiutarti a pianificare una socializzazione tranquilla.",q:[{t:"Come faccio un incontro sicuro?"},{t:"Quanto deve durare?"},{t:"Come proteggo la privacy?"}],fallback:"Preferisci un primo incontro breve, in luogo neutro e con posizioni sempre approssimate."},
              "place-vet":{ctx:"Luoghi · Veterinario",greeting:"Sto guardando la scheda del veterinario dimostrativo e il promemoria vaccinale di Enea. Cosa vuoi verificare?",q:[{t:"Cosa devo prenotare?"},{t:"Cosa porto alla visita?"},{t:"Quando è urgente chiamare?"}],fallback:"La scheda ricorda l'antirabbica in scadenza: verifica la data reale e prenota con il tuo veterinario."},
              "place-add":{ctx:"Luoghi · Nuova segnalazione",greeting:"Sto guardando la schermata per aggiungere una segnalazione demo. Posso aiutarti a descriverla in modo utile e rispettoso della privacy.",q:[{t:"Cosa devo scrivere?"},{t:"Quali dati non devo inserire?"},{t:"Come scelgo la categoria?"}],fallback:"Descrivi il rischio in modo breve, senza nomi o indirizzi privati, e scegli la categoria più precisa."}
            };

            function _contextUi(key){ return EXTRA_ASSIST[key]||ASSIST[key]||ASSIST.home; }
            function _safeBubble(text,who){
              var row=document.createElement("div");
              var bubble=document.createElement("div");
              bubble.className=who==="user"?"chat-bubble-user":"chat-bubble-bot";
              bubble.textContent=String(text||"");
              if(who==="user") row.className="flex justify-end";
              row.appendChild(bubble);
              return row;
            }
            function _contextHistory(){
              return (window._assistMsgs||[]).slice(0,-1).slice(-18).map(function(item){
                return {role:item.r==="u"?"user":"assistant",content:String(item.t||"")};
              });
            }
            async function _aiReplyV4(key,question,curated){
              var log=document.getElementById("assist-ctx-log");
              var input=document.getElementById("assist-ctx-input");
              var sendButton=input&&input.parentElement?input.parentElement.querySelector("button"):null;
              if(input) input.disabled=true;
              if(sendButton) sendButton.disabled=true;
              var typing=_safeBubble("Sto pensando…","bot");
              typing.setAttribute("data-context-typing","true");
              log.appendChild(typing);
              _scrollBottom();
              try{
                var session=window.FrenchiePal.getSessionContext();
                var chat=window._assistSession||window.FrenchiePal.createContextChatSession(key);
                window._assistSession=chat;
                var response=await fetch("/api/chat",{
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({
                    session_id:session.session_id,
                    chat_session_id:chat.chat_session_id,
                    device_type:window.FrenchiePal.getDeviceType(),
                    landing_version:session.landing_version,
                    started_at:session.started_at,
                    chat_started_at:chat.started_at,
                    source_section:"context_assistant",
                    message_source:"context_input",
                    context_key:key,
                    message:question,
                    client_history:_contextHistory()
                  })
                });
                var data=await response.json().catch(function(){return {};});
                typing.remove();
                var reply=response.ok&&data.reply?data.reply:(data.error||curated||"L'assistente non è disponibile. Riprova tra poco.");
                log.appendChild(_safeBubble(reply,"bot"));
                window._assistMsgs.push({r:"a",t:reply});
                if(/@/.test(question)) window.FrenchiePal.markSessionLeadCaptured();
              }catch(error){
                typing.remove();
                var fallback=curated||"L'assistente non è disponibile. Riprova tra poco.";
                log.appendChild(_safeBubble(fallback,"bot"));
                window._assistMsgs.push({r:"a",t:fallback});
              }
              if(input) input.disabled=false;
              if(sendButton) sendButton.disabled=false;
              if(input) input.focus();
              _scrollBottom();
            }
            window.openAssistant=function(key){
              var c=_contextUi(key);
              var active=document.querySelector("#phone-frame .phone-screen.active");
              window._assistOrigin=active?active.id:null;
              window._assistKey=key;
              window._assistSession=window.FrenchiePal.createContextChatSession(key);
              window._assistMsgs=[{r:"a",t:c.greeting}];
              var banner=document.getElementById("assist-ctx-banner");
              banner.innerHTML="";
              var icon=document.createElement("span");
              icon.className="material-symbols-outlined";
              icon.style.cssText="font-size:19px;color:#5e7350;flex:none;font-variation-settings:'FILL' 1;";
              icon.textContent="insights";
              var copy=document.createElement("div");
              var eyebrow=document.createElement("div");
              eyebrow.style.cssText="font-size:8px;font-weight:800;letter-spacing:.06em;color:#5e7350;text-transform:uppercase;";
              eyebrow.textContent="Sta assistendo su";
              var label=document.createElement("div");
              label.style.cssText="font-size:12.5px;font-weight:700;color:#3f4a36;";
              label.textContent=c.ctx;
              copy.appendChild(eyebrow); copy.appendChild(label);
              banner.appendChild(icon); banner.appendChild(copy);
              var log=document.getElementById("assist-ctx-log");
              log.innerHTML="";
              log.appendChild(_safeBubble(c.greeting,"bot"));
              var suggestions=document.createElement("div");
              suggestions.id="assist-ctx-sugg";
              suggestions.style.cssText="display:flex;flex-direction:column;gap:9px;margin-top:2px;";
              (c.q||[]).forEach(function(item,index){
                var button=document.createElement("button");
                button.type="button";
                button.style.cssText="display:flex;align-items:center;gap:10px;border:1px solid #e6dcc8;border-radius:14px;padding:11px 13px;font-size:12px;font-weight:600;color:#574f44;background:#fbf9f4;cursor:pointer;text-align:left;font-family:Nunito,sans-serif;";
                var help=document.createElement("span");
                help.className="material-symbols-outlined";
                help.style.cssText="font-size:18px;color:#5e7350;flex:none;";
                help.textContent="help";
                var text=document.createElement("span");
                text.textContent=item.t;
                button.appendChild(help); button.appendChild(text);
                button.addEventListener("click",function(){window.assistAsk(key,index);});
                suggestions.appendChild(button);
              });
              log.appendChild(suggestions);
              if(window.trackEvent) window.trackEvent("context_assistant_open",{sourceSection:"context_assistant",metadata:{context_key:key,origin_screen:window._assistOrigin}});
              openSubScreen("screen-assist-ctx");
            };
            window.assistAsk=function(key,index){
              var c=_contextUi(key), item=(c.q||[])[index];
              if(!item) return;
              var log=document.getElementById("assist-ctx-log");
              var suggestions=document.getElementById("assist-ctx-sugg");
              if(suggestions) suggestions.remove();
              log.appendChild(_safeBubble(item.t,"user"));
              window._assistMsgs.push({r:"u",t:item.t});
              if(window.trackEvent) window.trackEvent("context_assistant_suggestion_click",{sourceSection:"context_assistant",metadata:{context_key:key,question:item.t}});
              _scrollBottom();
              _aiReplyV4(key,item.t,item.a||c.fallback);
            };
            window.assistSend=function(){
              var input=document.getElementById("assist-ctx-input");
              var value=(input.value||"").trim();
              if(!value) return;
              if(value.length>1600){ alert("Il messaggio può contenere massimo 1600 caratteri."); return; }
              var key=window._assistKey||"home", c=_contextUi(key);
              var suggestions=document.getElementById("assist-ctx-sugg");
              if(suggestions) suggestions.remove();
              document.getElementById("assist-ctx-log").appendChild(_safeBubble(value,"user"));
              input.value="";
              window._assistMsgs.push({r:"u",t:value});
              _scrollBottom();
              _aiReplyV4(key,value,c.fallback);
            };
})();
