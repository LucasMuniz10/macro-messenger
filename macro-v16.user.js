// ==UserScript==
// @name         Messenger - Macro V16 (Fix Botões + Fim de Lista)
// @namespace    http://tampermonkey.net/
// @version      16.0
// @description  Correção dos seletores de aba (Span) e parada automática se não houver mais leads.
// @author       Manus + Final Fix
// @match        https://business.facebook.com/*
// @grant        none
// @run-at       document-idle

// AUTO UPDATE VIA GITHUB
// @updateURL    https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// @downloadURL  https://raw.githubusercontent.com/LucasMuniz10/macro-messenger/main/macro-v16.user.js
// ==/UserScript==
(function() {
    'use strict';

    // ================= CONFIGURAÇÃO =================

    const CONFIG = {
        QTD_PARA_REFRESH: 15, // A cada 15 leads, alterna as abas
        QTD_PARA_PAUSA: 30,   // Pausa longa a cada 30
        PAUSA_MINUTOS_MIN: 1,
        PAUSA_MINUTOS_MAX: 3,
        LIMITE_DIARIO: 500
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

    // ================= VARIÁVEIS DE CONTROLE =================
    let loopAtivo = false;
    let contProcessados = 0;
    let contEnviados = 0;
    let contEnviadosLote = 0;
    let contCicloRefresh = 0;
    let contPualdosHoje = 0;
    let contExcluidos = 0;
    let tentativasSemLead = 0; // Contador para parar se a lista estiver vazia

    // ================= UTILITÁRIOS =================

    function log(msg) {
        console.log('[Macro V16] →', msg);
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
            else if (tipo === 'info') el.style.color = '#00ccff';
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

    // ================= FUNÇÃO DE CLIQUE POR TEXTO (Baseado nos seus Prints) =================

    // Essa função busca o texto exato dentro de SPANs, conforme seus prints
    function clicarElementoPorTexto(textoParcial) {
        // XPath para encontrar qualquer elemento que contenha o texto
        const xpath = `//span[contains(text(), "${textoParcial}")]`;
        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < result.snapshotLength; i++) {
            const el = result.snapshotItem(i);
            // Verifica se está visível e se parece ser o botão correto (não é um texto de chat aleatório)
            if (isVisible(el)) {
                // Clica no elemento pai (o container do span) para garantir, ou no próprio span
                log(`Clicando no botão: ${textoParcial}`);
                el.click();

                // Tenta clicar no pai também, caso o span não capture o clique
                if (el.parentElement) el.parentElement.click();

                return true;
            }
        }
        return false;
    }

    async function atualizarListaCompleta() {
        log('🔄 REFRESH: Alternando abas...');

        // 1. Clicar em "Todas as mensagens"
        setStatusGlobal('Aba: Todas as mensagens...', 'info');
        // Busca exatamente o texto do seu print
        const clicouTodas = clicarElementoPorTexto('Todas as');

        if (clicouTodas) {
            await new Promise(r => setTimeout(r, 8000)); // Espera carregar
        } else {
            log('⚠️ Botão "Todas as mensagens" não encontrado.');
        }

        // 2. Clicar em "Messenger"
        setStatusGlobal('Aba: Messenger...', 'info');
        // Busca o span com texto Messenger (ignorando "Responder no Messenger")
        const links = Array.from(document.querySelectorAll('span'));
        const btnMessenger = links.find(el => el.innerText.trim() === 'Messenger' && isVisible(el));

        if (btnMessenger) {
            btnMessenger.click();
            if(btnMessenger.parentElement) btnMessenger.parentElement.click();

            log('Voltou para Messenger. Aguardando lista...');
            await new Promise(r => setTimeout(r, 10000)); // Espera carregar e subir topo
            return true;
        } else {
            log('⚠️ Botão "Messenger" não encontrado (CRÍTICO).');
            return false;
        }
    }

    // ================= SEGURANÇA =================

    async function verificarPausaDeSeguranca() {
        if (contEnviadosLote >= CONFIG.QTD_PARA_PAUSA) {
            const tempoMin = CONFIG.PAUSA_MINUTOS_MIN * 60 * 1000;
            const tempoMax = CONFIG.PAUSA_MINUTOS_MAX * 60 * 1000;
            const tempoEspera = Math.floor(Math.random() * (tempoMax - tempoMin + 1)) + tempoMin;
            const minutosReais = (tempoEspera / 60000).toFixed(1);

            log(`PAUSA DE SEGURANÇA: ${minutosReais} min...`);
            setStatusGlobal(`☕ Pausa: ${minutosReais} min...`, 'aviso');
            contEnviadosLote = 0;
            await new Promise(r => setTimeout(r, tempoEspera));
            return true;
        }
        return false;
    }

    // ================= LÓGICA TIMESTAMP =================

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
        const ehHoje =
            dataMensagem.getDate() === agora.getDate() &&
            dataMensagem.getMonth() === agora.getMonth() &&
            dataMensagem.getFullYear() === agora.getFullYear();

        return ehHoje ? "HOJE" : "ANTIGO";
    }

    async function excluirConversa() {
        const possiveisBotoes = Array.from(document.querySelectorAll('div[role="button"], div[aria-label]'));
        let btnMenu = possiveisBotoes.find(b => {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            return label.includes('ações') || label.includes('actions') || label.includes('mais');
        });
        if (!btnMenu) {
            const header = document.querySelector('div[role="main"] h2')?.closest('div')?.parentElement;
            if (header) btnMenu = header.querySelector('div[role="button"]');
        }
        if (btnMenu) {
            btnMenu.click();
            await esperar(800, 1200);
            const opcoes = Array.from(document.querySelectorAll('div[role="menuitem"], span'));
            const btnExcluir = opcoes.find(el => {
                const txt = (el.innerText || '').toLowerCase();
                return txt.includes('excluir') || txt.includes('delete');
            });
            if (btnExcluir) {
                btnExcluir.click();
                await esperar(1000, 1500);
                const botoesModal = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"]'));
                const btnConfirmar = botoesModal.find(b => {
                    const txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
                    return txt === 'excluir' || txt === 'delete';
                });
                if (btnConfirmar) { btnConfirmar.click(); return true; }
            }
        }
        return false;
    }

    async function verificarBloqueio() {
        const corpo = document.body.innerText;
        if (corpo.includes("Você não pode mais enviar mensagens") || corpo.includes("You can't send messages")) return true;
        const campo = document.querySelector('div[contenteditable="true"][role="textbox"], textarea');
        if (!campo) {
            const footer = document.querySelector('div[aria-disabled="true"]');
            if(footer) return true;
            return true;
        }
        return false;
    }

    async function clicarConcluir() {
        const seletores = ['[aria-label="Mover para Concluídos"]', '[aria-label="Concluído"]', '[aria-label="Done"]'];
        let btn = null;
        for (const sel of seletores) {
            btn = document.querySelector(sel);
            if (btn && isVisible(btn)) break;
        }
        if(!btn) {
            const todos = document.querySelectorAll('div[role="button"]');
            for(const b of todos) {
                const l = (b.getAttribute('aria-label')||'').toLowerCase();
                if(l.includes('conclu') || l.includes('mover para')) { btn = b; break; }
            }
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
        await esperar(1500, 2500);

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
        // Mira Laser: Usa a busca como âncora
        let ancora = document.querySelector('input[placeholder*="Pesquisar"], input[aria-label*="Pesquisar"]');
        if (!ancora) ancora = document.querySelector('div[role="search"]');

        if (ancora) {
            const rect = ancora.getBoundingClientRect();
            const x = rect.left + (rect.width / 2);
            const y = rect.bottom + 100; // Ponto de clique no 1º lead

            // Visual Debug (ponto vermelho)
            const p = document.createElement('div');
            p.style.cssText = `position:fixed;top:${y}px;left:${x}px;width:6px;height:6px;background:red;border-radius:50%;z-index:999999;pointer-events:none;opacity:0.7;`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 500);

            // Verifica se existe elemento no ponto
            const el = document.elementFromPoint(x, y);

            // SE O EL FOR NULO OU NÃO FOR UM LEAD (EX: ESPAÇO EM BRANCO), RETORNA FALSE
            if (el && (el.tagName === 'DIV' || el.tagName === 'SPAN')) {
                el.click();
                if(el.parentElement) el.parentElement.click();
                return true;
            }
        } else {
            // Tentativa cega na lateral
            const el = document.elementFromPoint(150, 250);
            if(el) { el.click(); return true; }
        }
        return false;
    }

    // ================= LOOP PRINCIPAL =================

    async function cicloV16() {
        if (!loopAtivo) return;

        if (contEnviados >= CONFIG.LIMITE_DIARIO) {
            setStatusGlobal('META BATIDA!', 'erro');
            loopAtivo = false;
            alert(`Meta de ${CONFIG.LIMITE_DIARIO} mensagens atingida!`);
            return;
        }

        try {
            // VERIFICA SE PRECISA DO REFRESH
            if (contCicloRefresh >= CONFIG.QTD_PARA_REFRESH) {
                await atualizarListaCompleta();
                contCicloRefresh = 0;
            }

            contProcessados++;
            contCicloRefresh++;
            updateCounters();

            // 1. SELECIONA 1º LEAD
            const selecionou = await selecionarPrimeiroLead();

            if(!selecionou) {
                // SE NÃO ACHOU LEAD
                tentativasSemLead++;
                log(`Nenhum lead encontrado (${tentativasSemLead}/3).`);

                if (tentativasSemLead >= 3) {
                    log('Fim da lista detectado. Parando robô.');
                    setStatusGlobal('FIM DA LISTA (PARADO)', 'erro');
                    loopAtivo = false;
                    alert('Robô parou: Não há mais conversas na lista.');
                    return;
                }

                // Espera um pouco e tenta de novo (pode ser delay de carregamento)
                await esperar(3000, 5000);
                cicloV16();
                return;
            }
            else {
                // SE ACHOU, RESETA O CONTADOR DE ERROS
                tentativasSemLead = 0;
            }

            await esperar(2000, 3000);

            // 2. ANALISA
            const statusData = await analisarDataLateral();

            if (statusData === 'HOJE') {
                log('HOJE (Pular).');
                contPualdosHoje++;
                updateCounters();
                await clicarConcluir();
            }
            else {
                log('ANTIGO (Processar).');
                const bloqueado = await verificarBloqueio();

                if (bloqueado) {
                    log('Bloqueado -> Excluir');
                    const excluiu = await excluirConversa();
                    if(excluiu) contExcluidos++;
                    else await clicarConcluir();
                }
                else {
                    log('Válido -> Enviar');
                    const enviou = await enviarMsg();
                    if (enviou) {
                        contEnviados++;
                        contEnviadosLote++;

                        await esperar(2000, 3000);
                        await clicarConcluir();

                        // Pausa de Café
                        await verificarPausaDeSeguranca();
                    } else {
                        await clicarConcluir();
                    }
                }
            }

            // 3. REINICIA
            updateCounters();
            if (loopAtivo) {
                const delay = Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000;
                await new Promise(r => setTimeout(r, delay));
                cicloV16();
            }

        } catch (e) {
            console.error(e);
            loopAtivo = false;
        }
    }

    // ================= PAINEL =================

    function criarPainel() {
        if (document.getElementById('macro-panel-v16')) return;
        const p = document.createElement('div');
        p.id = 'macro-panel-v16';
        p.style.cssText = `position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a1a;color:#ff00ff;padding:15px;border:2px solid #ff00ff;border-radius:10px;width:280px;font-family:monospace;font-size:11px;box-shadow:0 0 15px rgba(255,0,255,0.3);`;
        p.innerHTML = `
            <h3 style="margin:0 0 10px;text-align:center;color:#ff00ff">MACRO V16 (FIX LISTA VAZIA)</h3>
            <div id="macro-status" style="margin-bottom:10px;font-weight:bold;color:yellow;text-align:center;">Parado</div>
            <div id="macro-counters" style="margin-bottom:15px;color:#ccc;border-bottom:1px solid #333;padding-bottom:5px;text-align:center;">Carregando...</div>
            <div style="font-size:10px;color:#888;margin-bottom:5px;text-align:center;">Refresh a cada ${CONFIG.QTD_PARA_REFRESH} leads</div>
            <button id="btn-start" style="width:100%;background:#00e676;color:black;border:none;padding:10px;cursor:pointer;margin-bottom:8px;font-weight:bold;border-radius:5px;">▶ INICIAR</button>
            <button id="btn-stop" style="width:100%;background:#ff1744;color:white;border:none;padding:10px;cursor:pointer;font-weight:bold;border-radius:5px;">⏹ PARAR</button>
        `;
        document.body.appendChild(p);

        document.getElementById('btn-start').onclick = () => { if(!loopAtivo) { loopAtivo = true; cicloV16(); }};
        document.getElementById('btn-stop').onclick = () => { loopAtivo = false; setStatusGlobal('Parado', 'erro'); };
    }

    setTimeout(criarPainel, 2000);

})();
