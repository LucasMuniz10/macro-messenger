// ==UserScript==
// @name         Messenger - Macro V16.17 (V16.9 + Trava Botão Concluir)
// @namespace    http://tampermonkey.net/
// @version      16.17
// @description  Automação completa com pausas programadas para broadcast e reset de abas.
// @author       Gemini + Manus + Especialista
// @match        https://business.facebook.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// @downloadURL  https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// ==/UserScript==

(function() {
    'use strict';

    // === ANTI BACKGROUND THROTTLING ===

Object.defineProperty(document, 'hidden', {value: false});
Object.defineProperty(document, 'visibilityState', {value: 'visible'});

document.addEventListener('visibilitychange', function(e) {
    e.stopImmediatePropagation();
}, true);

document.addEventListener('webkitvisibilitychange', function(e) {
    e.stopImmediatePropagation();
}, true);

document.addEventListener('blur', function(e) {
    e.stopImmediatePropagation();
}, true);

document.addEventListener('focus', function(e) {
    e.stopImmediatePropagation();
}, true);

window.onblur = null;
window.onfocus = null;

// mantém timers ativos e lista atualizando
setInterval(() => {

    window.dispatchEvent(new Event('mousemove'));

    document.dispatchEvent(new Event('mousemove'));

    document.dispatchEvent(new Event('scroll'));

}, 3000);

console.log("ANTI-THROTTLING ATIVO");

    // ================= AUTO RELOAD PREVENTIVO (25-35 MIN) =================
    (function agendarReloadAutomatico() {
        const min = 25 * 60 * 1000;
        const max = 35 * 60 * 1000;
        const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
        setTimeout(() => { location.reload(); }, tempo);
    })();

    // ================= CONFIGURAÇÃO =================
    const CONFIG = {
        QTD_PARA_REFRESH: 15,
        QTD_PARA_PAUSA: 30,
        PAUSA_MINUTOS_MIN: 1,
        PAUSA_MINUTOS_MAX: 3,
        LIMITE_DIARIO: 500,
        PAUSA_EXPEDIENTE_MIN_HORAS: 3.0,
        PAUSA_EXPEDIENTE_MAX_HORAS: 4.5,
        PAUSA_RECOMECO_RECICLAGEM_MIN: 60, // 1 hora
        PAUSA_RECOMECO_RECICLAGEM_MAX: 90, // 1.5 hora
        RECICLAGEM_PAUSA_LOTE: 30,
        RECICLAGEM_ESPERA_LOTE_SEG: [15, 30]
    };

    const MENSAGENS = [
        "Oi, meu bem! 😘 Tá curtindo os conteúdos que mandei? Quer que eu capricho ainda mais? 😈 Se quiser ver mais é só clicar no link e entrar no meu GRUPO VIP https://t.me/+sQhYMvKCAaU1NjRh",
        "E aí, amor, o que achou do presentinho que te enviei? Se quiser ver mais conteudos VIP é só clicar aqui --> https://dicasdigrana.com/musas",
        "Oi, lindo! 😍 Tô pensando em te mandar algo bem especial hoje... Se quiser ver mais conteudos VIP é só clicar aqui --> https://dicasdigrana.com/musas2",
        "Meu amor, Se quiser ver mais conteudos VIP é só clicar aqui --> https://bit.ly/PRIVADOALINE",
        "Meu amor, Se quiser ver mais conteudos VIP é só clicar aqui --> https://dicasdigrana.com/musas",
        "Meu amor, Se quiser ver mais conteudos VIP é só clicar aqui --> https://dicasdigrana.com/musas2",
        "Meu amor, Se quiser ver mais conteudos EXCLUSIVOS é só clicar aqui --> https://bit.ly/PRIVADOALINE",
        "Oi, gato! 😘 Se quiser ver mais conteudos VIP é só Clicar aqui ---> https://papoatual.com.br/land10",
        "E aí, coração? 😍 Tô com um presentinho quente pra te mandar, quer agora ou espero um pouquinho?",
        "Oi, amorzinho! 😈 Tá gostando do que tá vendo? Posso te surpreender ainda mais, viu?"
    ];

    let loopAtivo = false;
    let contProcessados = 0;
    let contEnviados = 0;
    let contEnviadosLote = 0;
    let contPualdosHoje = 0;
    let tentativasSemLead = 0;
    let emReciclagem = false;

    // ================= UTILITÁRIOS =================
    function log(msg) { console.log('[Macro VPS] →', msg); setStatusGlobal(msg); }
    const esperar = ms => new Promise(r => setTimeout(r, ms));
    function isVisible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }

    function setStatusGlobal(msg, tipo = 'normal') {
        const el = document.getElementById('macro-status');
        if (el) {
            el.textContent = msg;
            el.style.color = tipo === 'erro' ? '#ff5555' : (tipo === 'aviso' ? '#ffff00' : '#00ff00');
        }
    }

    // ================= LÓGICA DE HORÁRIO BROADCAST =================
    function verificarHorarioBroadcast() {
        const agora = new Date();
        const hora = agora.getHours();
        const min = agora.getMinutes();
        const tempoEmMinutos = (hora * 60) + min;

        // Janela 1: 12:00 (720 min) às 13:00 (780 min)
        if (tempoEmMinutos >= 720 && tempoEmMinutos < 780) return true;

        // Janela 2: 00:00 (0 min) às 01:30 (90 min)
        if (tempoEmMinutos >= 0 && tempoEmMinutos < 90) return true;

        return false;
    }

    async function executarResetAbas() {
        log('🔄 Resetando Abas para atualizar lista pós-broadcast...');
        const xpathTodas = `//span[contains(text(), "Todas as")]`;
        const resTodas = document.evaluate(xpathTodas, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (resTodas && isVisible(resTodas)) {
            resTodas.click();
            if (resTodas.parentElement) resTodas.parentElement.click();
            await esperar(8000);
        }
        const spans = Array.from(document.querySelectorAll('span'));
        const btnMessenger = spans.find(el => el.innerText.trim() === 'Messenger' && isVisible(el));
        if (btnMessenger) {
            btnMessenger.click();
            if (btnMessenger.parentElement) btnMessenger.parentElement.click();
            await esperar(10000);
        }
    }

    // ================= ANÁLISE DE DATA (HOJE/ANTIGO) =================
    async function analisarDataLateral() {
        let cartaoAtivo = document.querySelector('div[role="gridcell"][aria-selected="true"], div[role="option"][aria-selected="true"]');
        if (!cartaoAtivo) {
            const itens = document.querySelectorAll('div.xeuugli');
            if (itens.length > 0) cartaoAtivo = itens[0];
        }
        if (!cartaoAtivo) return "ANTIGO";

        const abbr = cartaoAtivo.querySelector('abbr.timestamp[data-utime], abbr[data-utime]');
        if (!abbr) return "ANTIGO";

        const utime = parseFloat(abbr.getAttribute("data-utime"));
        if (!utime) return "ANTIGO";

        const dataMensagem = new Date(utime * 1000);
        const agora = new Date();
        const ehHoje = dataMensagem.getDate() === agora.getDate() &&
                       dataMensagem.getMonth() === agora.getMonth() &&
                       dataMensagem.getFullYear() === agora.getFullYear();

        return ehHoje ? "HOJE" : "ANTIGO";
    }

    // ================= MOTOR DE RECICLAGEM (V17 + V18.6) =================
    async function fluxoReciclagemCompleto() {
        if (emReciclagem) return;
        emReciclagem = true;
        log('♻️ Iniciando Reciclagem de Leads...');

        const btnFiltro = document.querySelector('[aria-label="Filtros"]');
        if (btnFiltro) { btnFiltro.click(); await esperar(4000); }

        let scrollContainer = null;
        const dialog = document.querySelector('div[role="dialog"]');
        if (dialog) {
            const divs = Array.from(dialog.querySelectorAll('div'));
            for (let el of divs) {
                const style = window.getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50) {
                    scrollContainer = el;
                    break;
                }
            }
        }

        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            await esperar(2000);
        }

        const btnsDialog = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] span'));
        const btnConcluidos = btnsDialog.find(el => el.innerText && el.innerText.trim() === 'Concluídos' && isVisible(el));

        if (btnConcluidos) {
            btnConcluidos.click();
            await esperar(2500);
            const btnAplicar = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText && el.innerText.trim() === 'Aplicar' && isVisible(el));
            if (btnAplicar) { btnAplicar.click(); await esperar(8000); }
        }

        let totalMovidos = 0;
        let movidosNoLote = 0;

        while (true) {
            const btnMover = document.querySelector('[aria-label="Mover para Principal"]');
            if (!btnMover || !loopAtivo) break;

            btnMover.click();
            totalMovidos++;
            movidosNoLote++;
            await esperar(2500); 

            if (movidosNoLote >= CONFIG.RECICLAGEM_PAUSA_LOTE) {
                const pausa = Math.floor(Math.random() * (CONFIG.RECICLAGEM_ESPERA_LOTE_SEG[1] - CONFIG.RECICLAGEM_ESPERA_LOTE_SEG[0] + 1) + CONFIG.RECICLAGEM_ESPERA_LOTE_SEG[0]);
                log(`☕ Pausa Lote: ${pausa}s`);
                await esperar(pausa * 1000);
                movidosNoLote = 0;
            }
        }

        await executarResetAbas();

        const esperaMin = Math.floor(Math.random() * (CONFIG.PAUSA_RECOMECO_RECICLAGEM_MAX - CONFIG.PAUSA_RECOMECO_RECICLAGEM_MIN + 1)) + CONFIG.PAUSA_RECOMECO_RECICLAGEM_MIN;
        log(`⏳ Ciclo Resetado. Aguardando ${esperaMin} min...`);
        setStatusGlobal(`☕ Reinicia em ${esperaMin}m`, 'aviso');
        await esperar(esperaMin * 60000);
        
        emReciclagem = false;
        tentativasSemLead = 0;
        contPualdosHoje = 0;
        cicloV16();
    }

    // ================= LÓGICA DE SEGURANÇA E ENVIO =================
    async function verificarBloqueio() {
        if (document.body.innerText.includes("Você não pode mais enviar mensagens")) return true;
        const campo = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
        if (!campo) { await esperar(5000); return !document.querySelector('div[contenteditable="true"][role="textbox"], textarea'); }
        return false;
    }

    async function enviarMsg() {
        const campo = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
        if (!campo) return false;
        const msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
        campo.focus();
        document.execCommand('insertText', false, msg);
        await esperar(3000);
        const btn = Array.from(document.querySelectorAll('div[role="button"]')).find(b => (b.getAttribute('aria-label')||'').toLowerCase().includes('enviar'));
        if (btn) btn.click(); else campo.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
        return true;
    }

    async function clicarConcluir() {
        const btn = document.querySelector('[aria-label="Mover para Concluídos"], [aria-label="Concluído"]');
        if (btn && isVisible(btn)) { btn.click(); return true; }
        return false;
    }

    // NOVA FUNÇÃO DE SUPORTE
    function checarBotaoConcluir() {
        const btn = document.querySelector('[aria-label="Mover para Concluídos"], [aria-label="Concluído"], [aria-label="Done"]');
        return !!(btn && isVisible(btn));
    }

    async function selecionarPrimeiroLead() {
        let busca = document.querySelector('input[placeholder*="Pesquisar"]');
        if (!busca) return false;

        const rect = busca.getBoundingClientRect();

        // Tenta 3x clicar e validar se o chat abriu (botão concluir apareceu)
        for (let i = 0; i < 3; i++) {
            const el = document.elementFromPoint(rect.left + 50, rect.bottom + (100 + (i * 20))); // Muda levemente o ponto se falhar
            if (el && (el.tagName === 'DIV' || el.tagName === 'SPAN')) {
                el.click();
                await esperar(3000); // Espera o chat carregar
                
                if (checarBotaoConcluir()) {
                    return true; // Sucesso: chat aberto
                }
            }
            log(`Tentativa ${i+1} de abrir lead sem sucesso...`);
            await esperar(2000);
        }

        return false; // Se chegar aqui, falhou 3x e o ciclo principal chamará reciclagem
    }

    // ================= LOOP PRINCIPAL =================
    async function cicloV16() {
        if (!loopAtivo || emReciclagem) return;

        // VERIFICAÇÃO DE HORÁRIO DE CONGELAMENTO (BROADCAST)
        if (verificarHorarioBroadcast()) {
            log('❄️ Horário de Broadcast detectado. Congelando automação...');
            setStatusGlobal('❄️ Pausa Broadcast', 'aviso');
            
            while (verificarHorarioBroadcast()) {
                await esperar(60000); // Checa a cada 1 minuto se o horário acabou
            }
            
            log('🔥 Horário de Broadcast encerrado. Atualizando lista antes de recomeçar...');
            await executarResetAbas();
        }

        if (contEnviados >= CONFIG.LIMITE_DIARIO) {
            const h = Math.random() * (CONFIG.PAUSA_EXPEDIENTE_MAX_HORAS - CONFIG.PAUSA_EXPEDIENTE_MIN_HORAS) + CONFIG.PAUSA_EXPEDIENTE_MIN_HORAS;
            log(`💤 Pausa Diária: ${h.toFixed(2)}h`);
            await esperar(h * 3600000);
            contEnviados = 0;
        }

        try {
            const achou = await selecionarPrimeiroLead();
            if(!achou) {
                tentativasSemLead++;
                log(`Lista vazia (${tentativasSemLead}/3)`);
                if (tentativasSemLead >= 3) { await fluxoReciclagemCompleto(); return; }
                setTimeout(cicloV16, 8000);
                return;
            }

            tentativasSemLead = 0;
            await esperar(4000);

            // PROTEÇÃO DE DATA
            const statusData = await analisarDataLateral();
            if (statusData === 'HOJE') {
                log('Lead de HOJE -> Pulando.');
                contPualdosHoje++;
                await clicarConcluir();
            } else {
                if (await verificarBloqueio()) {
                    log('Bloqueio detectado -> Concluindo');
                    await clicarConcluir();
                } else {
                    if (await enviarMsg()) {
                        contEnviados++;
                        contEnviadosLote++;
                        contProcessados++;
                        await esperar(4000);
                        await clicarConcluir();
                        
                        if (contEnviadosLote >= CONFIG.QTD_PARA_PAUSA) {
                            const p = (Math.random() * (CONFIG.PAUSA_MINUTOS_MAX - CONFIG.PAUSA_MINUTOS_MIN) + CONFIG.PAUSA_MINUTOS_MIN);
                            log(`Pausa Curta: ${p.toFixed(1)} min`);
                            contEnviadosLote = 0;
                            await esperar(p * 60000);
                        }
                    } else { await clicarConcluir(); }
                }
            }
            const elC = document.getElementById('macro-counters');
            if (elC) elC.textContent = `Env: ${contEnviados}/${CONFIG.LIMITE_DIARIO} | Hoje Pulados: ${contPualdosHoje} | Proc: ${contProcessados}`;
            setTimeout(cicloV16, 5000);
        } catch (e) {
            setTimeout(cicloV16, 15000);
        }
    }

    // ================= PAINEL COM BOTÃO STOP =================
    function criarPainel() {
        if (document.getElementById('macro-panel-v16')) return;
        const p = document.createElement('div');
        p.id = 'macro-panel-v16';
        p.style.cssText = `position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a1a;color:#ff00ff;padding:15px;border:2px solid #ff00ff;border-radius:10px;width:280px;font-family:monospace;font-size:11px;box-shadow:0 0 15px rgba(255,0,255,0.4);`;
        p.innerHTML = `
            <h3 style="text-align:center;color:#ff00ff;margin:0 0 10px">V16.17 FINAL VPS</h3>
            <div id="macro-status" style="text-align:center;color:yellow;margin-bottom:10px;font-weight:bold">Iniciando...</div>
            <div id="macro-counters" style="text-align:center;color:#ccc;margin-bottom:15px;border-top:1px solid #333;padding-top:5px">---</div>
            <button id="btn-stop" style="width:100%;background:#ff1744;color:white;border:none;padding:10px;cursor:pointer;font-weight:bold;border-radius:5px;">⏹ PARAR MANUALMENTE</button>
        `;
        document.body.appendChild(p);
        document.getElementById('btn-stop').onclick = () => { 
            loopAtivo = false; 
            setStatusGlobal('⏹ PARADO PELO USUÁRIO', 'erro'); 
            log('Interrompido manualmente.');
        };
    }

    setTimeout(() => {
        criarPainel();
        setTimeout(() => { loopAtivo = true; cicloV16(); }, 5000);
    }, 3000);
})();
