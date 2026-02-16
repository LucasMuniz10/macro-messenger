// ==UserScript==
// @name         Messenger - Macro V16.11 (Restaurado + Anti-Spam)
// @namespace    http://tampermonkey.net/
// @version      16.11
// @description  V16.9 idêntico + Travas de ID de chat + Histórico de envio que zera por dia.
// @author       Gemini + Manus + Especialista
// @match        https://business.facebook.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// @downloadURL  https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ================= AUTO RELOAD PREVENTIVO (25-35 MIN) =================
    (function agendarReloadAutomatico() {
        const min = 25 * 60 * 1000;
        const max = 35 * 60 * 1000;
        const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
        setTimeout(() => { location.reload(); }, tempo);
    })();

    // ================= CONFIGURAÇÃO (ORIGINAL RESTAURADA) =================
    const CONFIG = {
        QTD_PARA_REFRESH: 15,
        QTD_PARA_PAUSA: 30,
        PAUSA_MINUTOS_MIN: 1,
        PAUSA_MINUTOS_MAX: 3,
        LIMITE_DIARIO: 500,
        PAUSA_EXPEDIENTE_MIN_HORAS: 3.0,
        PAUSA_EXPEDIENTE_MAX_HORAS: 4.5,
        PAUSA_RECOMECO_RECICLAGEM_MIN: 60, 
        PAUSA_RECOMECO_RECICLAGEM_MAX: 90, 
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
    let ultimoIdConversa = null;

    // Sistema de Histórico Diário (Zera automaticamente todo dia)
    const dataChave = new Date().toISOString().split('T')[0];
    const storageKey = `macro_enviados_${dataChave}`;
    const enviadosHoje = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    function salvarEnviados() { localStorage.setItem(storageKey, JSON.stringify([...enviadosHoje])); }

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

    function pegarIdConversaAtual() {
        const candidates = Array.from(document.querySelectorAll('h1, h2, [role="heading"]'))
            .map(el => (el.innerText || '').trim())
            .filter(t => t.length >= 2 && t.length <= 80);
        return candidates[0] || null;
    }

    function verificarHorarioBroadcast() {
        const agora = new Date();
        const tempoEmMinutos = (agora.getHours() * 60) + agora.getMinutes();
        if (tempoEmMinutos >= 720 && tempoEmMinutos < 780) return true; 
        if (tempoEmMinutos >= 0 && tempoEmMinutos < 90) return true;
        return false;
    }

    async function executarResetAbas() {
        log('🔄 Resetando Abas...');
        const xpathTodas = `//span[contains(text(), "Todas as")]`;
        const resTodas = document.evaluate(xpathTodas, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (resTodas && isVisible(resTodas)) {
            resTodas.click(); if (resTodas.parentElement) resTodas.parentElement.click();
            await esperar(8000);
        }
        const spans = Array.from(document.querySelectorAll('span'));
        const btnMessenger = spans.find(el => el.innerText.trim() === 'Messenger' && isVisible(el));
        if (btnMessenger) {
            btnMessenger.click(); if (btnMessenger.parentElement) btnMessenger.parentElement.click();
            await esperar(10000);
        }
    }

    // ================= ANÁLISE DE DATA =================
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
        const dataM = new Date(utime * 1000);
        const agora = new Date();
        const ehHoje = dataM.getDate() === agora.getDate() && dataM.getMonth() === agora.getMonth() && dataM.getFullYear() === agora.getFullYear();
        return ehHoje ? "HOJE" : "ANTIGO";
    }

    // ================= MOTOR DE RECICLAGEM (ORIGINAL RESTAURADO) =================
    async function fluxoReciclagemCompleto() {
        if (emReciclagem) return;
        emReciclagem = true;
        log('♻️ Iniciando Reciclagem...');
        const btnFiltro = document.querySelector('[aria-label="Filtros"]');
        if (btnFiltro) { btnFiltro.click(); await esperar(4000); }

        let scrollContainer = null;
        const dialog = document.querySelector('div[role="dialog"]');
        if (dialog) {
            const divs = Array.from(dialog.querySelectorAll('div'));
            for (let el of divs) {
                const style = window.getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50) {
                    scrollContainer = el; break;
                }
            }
        }
        if (scrollContainer) { scrollContainer.scrollTop = scrollContainer.scrollHeight; await esperar(2000); }

        const btnsD = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] span'));
        const btnC = btnsD.find(el => el.innerText && el.innerText.trim() === 'Concluídos' && isVisible(el));
        if (btnC) {
            btnC.click(); await esperar(2500);
            const btnA = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.innerText && el.innerText.trim() === 'Aplicar' && isVisible(el));
            if (btnA) { btnA.click(); await esperar(8000); }
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
        log(`⏳ Aguardando recomeço: ${esperaMin}m`);
        setStatusGlobal(`☕ Reinicia em ${esperaMin}m`, 'aviso');
        await esperar(esperaMin * 60000);
        emReciclagem = false; tentativasSemLead = 0; cicloV16();
    }

    // ================= SELECIONAR LEAD (TRAVA DE ID) =================
    async function selecionarPrimeiroLead() {
        const idAntes = pegarIdConversaAtual();
        const busca = document.querySelector('input[placeholder*="Pesquisar"]');
        if (!busca) return false;

        const rect = busca.getBoundingClientRect();
        const el = document.elementFromPoint(rect.left + 50, rect.bottom + 140);
        if (!el) return false;

        const clicavel = el.closest('div[role="gridcell"], div[role="row"], div[role="option"], a, [role="link"], [role="button"], div');
        if (!clicavel) return false;

        clicavel.click();
        await esperar(1200);

        const idDepois = pegarIdConversaAtual();
        if (!idDepois || (idAntes && idDepois === idAntes) || (ultimoIdConversa && idDepois === ultimoIdConversa)) {
            return false;
        }

        ultimoIdConversa = idDepois;
        return true;
    }

    // ================= ENVIO =================
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
        campo.focus(); document.execCommand('insertText', false, msg);
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

    // ================= LOOP PRINCIPAL (ORIGINAL RESTAURADO) =================
    async function cicloV16() {
        if (!loopAtivo || emReciclagem) return;

        if (verificarHorarioBroadcast()) {
            log('❄️ Pausa Broadcast...');
            while (verificarHorarioBroadcast()) { await esperar(60000); }
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
                tentativasSemLead++; log(`Lista vazia (${tentativasSemLead}/3)`);
                if (tentativasSemLead >= 3) { await fluxoReciclagemCompleto(); return; }
                setTimeout(cicloV16, 8000); return;
            }

            tentativasSemLead = 0;
            await esperar(4000);

            // TRAVA DE IDEMPOTÊNCIA
            const idChat = pegarIdConversaAtual();
            if (idChat && enviadosHoje.has(idChat)) {
                log('⚠️ Já enviado hoje -> Pulando');
                await clicarConcluir(); setTimeout(cicloV16, 5000); return;
            }

            const statusData = await analisarDataLateral();
            if (statusData === 'HOJE') {
                log('Lead de HOJE -> Pulando'); contPualdosHoje++; await clicarConcluir();
            } else {
                if (await verificarBloqueio()) {
                    log('Bloqueio detectado -> Concluindo'); await clicarConcluir();
                } else {
                    if (await enviarMsg()) {
                        if (idChat) { enviadosHoje.add(idChat); salvarEnviados(); }
                        contEnviados++; contEnviadosLote++; contProcessados++;
                        await esperar(4000); await clicarConcluir();
                        
                        if (contEnviadosLote >= CONFIG.QTD_PARA_PAUSA) {
                            const p = (Math.random() * (CONFIG.PAUSA_MINUTOS_MAX - CONFIG.PAUSA_MINUTOS_MIN) + CONFIG.PAUSA_MINUTOS_MIN);
                            log(`Pausa Curta: ${p.toFixed(1)} min`);
                            contEnviadosLote = 0;
                            await esperar(p * 60000);
                        }
                    } else { await clicarConcluir(); }
                }
            }
            // ATUALIZAÇÃO DO PAINEL (RESTAURADA)
            const elC = document.getElementById('macro-counters');
            if (elC) elC.textContent = `Env: ${contEnviados}/${CONFIG.LIMITE_DIARIO} | Hoje Pulados: ${contPualdosHoje} | Proc: ${contProcessados}`;
            setTimeout(cicloV16, 5000);
        } catch (e) { setTimeout(cicloV16, 15000); }
    }

    // ================= PAINEL =================
    function criarPainel() {
        if (document.getElementById('macro-panel-v16')) return;
        const p = document.createElement('div');
        p.id = 'macro-panel-v16';
        p.style.cssText = `position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a1a;color:#ff00ff;padding:15px;border:2px solid #ff00ff;border-radius:10px;width:280px;font-family:monospace;font-size:11px;`;
        p.innerHTML = `<h3 style="text-align:center;color:#ff00ff;margin:0 0 10px">V16.11 FINAL VPS</h3><div id="macro-status" style="text-align:center;color:yellow;margin-bottom:10px;font-weight:bold">Iniciando...</div><div id="macro-counters" style="text-align:center;color:#ccc;margin-bottom:15px;border-top:1px solid #333;padding-top:5px">---</div><button id="btn-stop" style="width:100%;background:#ff1744;color:white;border:none;padding:10px;cursor:pointer;font-weight:bold;border-radius:5px;">⏹ PARAR MANUALMENTE</button>`;
        document.body.appendChild(p);
        document.getElementById('btn-stop').onclick = () => { loopAtivo = false; setStatusGlobal('⏹ PARADO', 'erro'); };
    }

    setTimeout(() => { criarPainel(); setTimeout(() => { loopAtivo = true; cicloV16(); }, 5000); }, 3000);
})();
