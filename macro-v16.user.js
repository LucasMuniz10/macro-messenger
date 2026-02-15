// ==UserScript==
// @name         Messenger - Macro V16.2 (Edição VPS 24h - Blindado)
// @namespace    http://tampermonkey.net/
// @version      16.2
// @description  Automação contínua para VPS com Auto-Reload e verificações de segurança avançadas.
// @author       Gemini + Manus + Especialista
// @match        https://business.facebook.com/*
// @updateURL    https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// @downloadURL  https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    // ================= AUTO UPDATE RELOAD (ALEATÓRIO 25–35 MIN) =================

function agendarReloadAutomatico() {

    // mínimo 25 min, máximo 35 min
    const min = 25 * 60 * 1000;
    const max = 35 * 60 * 1000;

    const tempo = Math.floor(Math.random() * (max - min + 1)) + min;

    const minutos = Math.round(tempo / 60000);

    console.log(`[Macro] Próximo reload automático em ${minutos} minutos`);

    setTimeout(() => {

        console.log('[Macro] Executando reload automático...');
        location.reload();

    }, tempo);

}

// inicia o ciclo
agendarReloadAutomatico();

// ========================================================================


    // ================= [MELHORIA 1] AUTO-RELOAD (CRÍTICO PARA VPS) =================
    // Recarrega a página inteira a cada 25-35 minutos para limpar a memória RAM
    (function autoReload() {
        const min = 25 * 60 * 1000;
        const max = 35 * 60 * 1000;
        const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log(`[Macro] Reload preventivo agendado em ${Math.round(tempo/60000)} min`);
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
        PAUSA_EXPEDIENTE_MAX_HORAS: 4.5
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
    let contCicloRefresh = 0;
    let contPualdosHoje = 0;
    let tentativasSemLead = 0;

    // ================= UTILITÁRIOS =================

    function log(msg) {
        console.log('[Macro VPS] →', msg);
        setStatusGlobal(msg);
    }

    function esperar(min, max) {
        return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
    }

    function setStatusGlobal(msg, tipo = 'normal') {
        const el = document.getElementById('macro-status');
        if (el) {
            el.textContent = msg;
            if (tipo === 'erro') el.style.color = '#ff5555';
            else if (tipo === 'aviso') el.style.color = '#ffff00';
            else el.style.color = '#00ff00';
        }
    }

    function updateCounters() {
        const el = document.getElementById('macro-counters');
        if (el) el.textContent = `Proc: ${contProcessados} | Env: ${contEnviados}/${CONFIG.LIMITE_DIARIO} | Hoje: ${contPualdosHoje}`;
    }

    function isVisible(el) {
        return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    }

    function clicarElementoPorTexto(textoParcial) {
        const xpath = `//span[contains(text(), "${textoParcial}")]`;
        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < result.snapshotLength; i++) {
            const el = result.snapshotItem(i);
            if (isVisible(el)) {
                el.click();
                if (el.parentElement) el.parentElement.click();
                return true;
            }
        }
        return false;
    }

    // ================= LÓGICA DE SEGURANÇA =================

    async function verificarPausaDeSeguranca() {
        if (contEnviadosLote >= CONFIG.QTD_PARA_PAUSA) {
            const tempoEspera = (Math.floor(Math.random() * (CONFIG.PAUSA_MINUTOS_MAX - CONFIG.PAUSA_MINUTOS_MIN + 1)) + CONFIG.PAUSA_MINUTOS_MIN) * 60000;
            log(`Pausa curta: ${(tempoEspera/60000).toFixed(1)} min`);
            contEnviadosLote = 0;
            await new Promise(r => setTimeout(r, tempoEspera));
        }
    }

    async function executarPausaExpediente() {
        const horas = (Math.random() * (CONFIG.PAUSA_EXPEDIENTE_MAX_HORAS - CONFIG.PAUSA_EXPEDIENTE_MIN_HORAS) + CONFIG.PAUSA_EXPEDIENTE_MIN_HORAS);
        const ms = Math.floor(horas * 60 * 60 * 1000);
        log(`💤 Pausa de expediente: ${horas.toFixed(2)} horas.`);
        await new Promise(r => setTimeout(r, ms));
        contEnviados = 0;
        contEnviadosLote = 0;
    }

    // [MELHORIA 3] - VERIFICAÇÃO DE BLOQUEIO MAIS SEGURA (MENOS AGRESSIVA)
    async function verificarBloqueio() {
        const corpo = document.body.innerText;
        if (corpo.includes("Você não pode mais enviar mensagens") || corpo.includes("You can't send messages")) return true;
        
        const campo = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
        if (!campo) {
            log('Campo não achado, conferindo novamente...');
            await esperar(4000, 6000); // Espera carregar antes de confirmar erro
            const campo2 = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
            return !campo2; // Se ainda não achou, está bloqueado ou erro de carregamento
        }
        return false;
    }

    // ================= AÇÕES =================

    async function clicarConcluir() {
        const seletores = ['[aria-label="Mover para Concluídos"]', '[aria-label="Concluído"]', '[aria-label="Done"]'];
        let btn = null;
        for (const sel of seletores) {
            btn = document.querySelector(sel);
            if (btn && isVisible(btn)) break;
        }
        if (btn) { btn.click(); return true; }
        return false;
    }

    async function enviarMsg() {
        const campo = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
        if (!campo) return false;
        const msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
        campo.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, msg);
        await esperar(2000, 3500);
        const btn = Array.from(document.querySelectorAll('div[role="button"]')).find(b => {
             const label = (b.getAttribute('aria-label') || '').toLowerCase();
             return label === 'enviar' || label.includes('send');
        });
        if (btn) btn.click();
        else {
             const evt = new KeyboardEvent('keydown', {key:'Enter', code:'Enter', bubbles:true, keyCode: 13});
             campo.dispatchEvent(evt);
        }
        return true;
    }

    async function selecionarPrimeiroLead() {
        let ancora = document.querySelector('input[placeholder*="Pesquisar"], input[aria-label*="Pesquisar"]');
        if (ancora) {
            const rect = ancora.getBoundingClientRect();
            const x = rect.left + (rect.width / 2);
            const y = rect.bottom + 100;
            const el = document.elementFromPoint(x, y);
            if (el && (el.tagName === 'DIV' || el.tagName === 'SPAN')) {
                el.click();
                if(el.parentElement) el.parentElement.click();
                return true;
            }
        }
        return false;
    }

    // ================= LOOP PRINCIPAL =================

    async function cicloV16() {
        if (!loopAtivo) return;

        if (contEnviados >= CONFIG.LIMITE_DIARIO) {
            await executarPausaExpediente();
            setTimeout(cicloV16, 5000);
            return;
        }

        try {
            contProcessados++;
            updateCounters();

            const selecionou = await selecionarPrimeiroLead();

            if(!selecionou) {
                tentativasSemLead++;
                log(`Lista vazia (${tentativasSemLead}/3)`);
                // [MELHORIA 2] - EVITA TRAVAMENTO NA LISTA VAZIA
                if (tentativasSemLead >= 3) {
                    log('Aguardando 10 min para re-checar...');
                    setTimeout(cicloV16, 600000); 
                    return; 
                }
                setTimeout(cicloV16, 8000);
                return;
            }

            tentativasSemLead = 0;
            await esperar(3000, 5000);

            const bloqueado = await verificarBloqueio();
            if (bloqueado) {
                log('Bloqueado ou Erro de Campo -> Concluindo');
                await clicarConcluir();
            } else {
                const enviou = await enviarMsg();
                if (enviou) {
                    contEnviados++;
                    contEnviadosLote++;
                    await esperar(3000, 5000);
                    await clicarConcluir();
                    await verificarPausaDeSeguranca();
                } else {
                    await clicarConcluir();
                }
            }

            setTimeout(cicloV16, Math.floor(Math.random() * 3000) + 3000);

        } catch (e) {
            console.error('Erro no loop:', e);
            setTimeout(cicloV16, 15000);
        }
    }

    // ================= INICIALIZAÇÃO =================

    function criarPainel() {
        if (document.getElementById('macro-panel-v16')) return;
        const p = document.createElement('div');
        p.id = 'macro-panel-v16';
        p.style.cssText = `position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a1a;color:#ff00ff;padding:15px;border:2px solid #ff00ff;border-radius:10px;width:280px;font-family:monospace;font-size:11px;`;
        p.innerHTML = `
            <h3 style="margin:0 0 10px;text-align:center;color:#ff00ff">MACRO VPS V16.2</h3>
            <div id="macro-status" style="margin-bottom:10px;font-weight:bold;color:yellow;text-align:center;">Iniciando...</div>
            <div id="macro-counters" style="margin-bottom:15px;color:#ccc;text-align:center;">Aguardando...</div>
            <button id="btn-stop" style="width:100%;background:#ff1744;color:white;border:none;padding:10px;cursor:pointer;font-weight:bold;border-radius:5px;">⏹ PARAR</button>
        `;
        document.body.appendChild(p);
        document.getElementById('btn-stop').onclick = () => { loopAtivo = false; };
    }

    setTimeout(() => {
        criarPainel();
        log('🚀 VPS: Iniciando em 5 segundos...');
        setTimeout(() => {
            loopAtivo = true;
            cicloV16();
        }, 5000);
    }, 3000);

})();
