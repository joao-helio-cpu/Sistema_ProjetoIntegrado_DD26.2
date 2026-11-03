/* =====================================================
   CASA ROSA - sistema de agendamento (HTML + CSS + JS)
   Os dados ficam salvos no navegador (localStorage).
   Login de teste:  usuário maria.recepcao  |  senha 123456
   ===================================================== */

// ---------- Dados fixos ----------
const USUARIOS = { "maria.recepcao": { senha: "123456", nome: "Maria" } };
const ESPECIALIDADES = ["Pré-natal", "Ultrassom", "Inserção de implanon", "Exame preventivo", "Fisioterapia",
  "Ginecologista", "Psicólogo(a)", "Hidroginástica", "Grupo de fibromialgia"];
const STATUS = ["Agendada", "Reagendada", "Presente", "Ausente", "Cancelada"];
const ICONE_STATUS = { Agendada: "●", Reagendada: "↻", Presente: "✓", Ausente: "✕", Cancelada: "⊘" };
const HORAS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

let modelos = JSON.parse(localStorage.getItem("cr_modelos")) || [
  { nome: "Confirmação de consulta", texto: "Olá, [nome]! Sua consulta na Casa Rosa é [especialidade], dia [data] às [hora]. Você consegue confirmar presença?" },
  { nome: "Lembrete de consulta", texto: "Olá, [nome]! Lembrando da sua consulta de [especialidade] na Casa Rosa, dia [data] às [hora]." }
];

// ---------- Funções de data ----------
function iso(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function somarDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function dataDe(s) { return new Date(s + "T12:00:00"); }
function dm(s) { return s.slice(8, 10) + "/" + s.slice(5, 7); }
function dmy(s) { return dm(s) + "/" + s.slice(0, 4); }
function idade(nasc) {
  const n = dataDe(nasc), h = new Date();
  let a = h.getFullYear() - n.getFullYear();
  if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a--;
  return a;
}
function nomeCurto(nome) {
  const p = nome.trim().split(" ");
  return p.length > 1 ? p[0] + " " + p[p.length - 1][0].toUpperCase() + "." : p[0];
}
function maiuscula(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

// ---------- Dados iniciais (exemplo) e salvamento ----------
function dadosIniciais() {
  const h = new Date();
  const d = n => iso(somarDias(h, n));
  return [
    { id: 1, nome: "Maria Souza", nasc: "1994-05-10", tel: "(88) 99999-0000", bairro: "Centro", esp: "Exame preventivo", data: d(0), hora: "08:00", prio: "Baixa", obs: "", status: "Presente", envio: "nao" },
    { id: 2, nome: "Joana Lima", nasc: "1985-02-20", tel: "(88) 98888-1111", bairro: "Campo Velho", esp: "Ginecologista", data: d(0), hora: "08:30", prio: "Média", obs: "", status: "Presente", envio: "nao" },
    { id: 3, nome: "Ana Paula Ribeiro", nasc: "1998-06-09", tel: "(88) 97777-2222", bairro: "Planalto", esp: "Pré-natal", data: d(0), hora: "09:15", prio: "Alta", obs: "Gestante", status: "Reagendada", envio: "nao" },
    { id: 4, nome: "Carla Mendes", nasc: "1990-08-15", tel: "(88) 96666-3333", bairro: "Centro", esp: "Ultrassom", data: d(0), hora: "09:30", prio: "Média", obs: "", status: "Ausente", envio: "nao" },
    { id: 5, nome: "Rita Costa", nasc: "2002-01-30", tel: "(88) 95555-4444", bairro: "Alto São Francisco", esp: "Inserção de implanon", data: d(0), hora: "10:45", prio: "Baixa", obs: "", status: "Agendada", envio: "nao" },
    { id: 6, nome: "Edna Batista", nasc: "1979-03-12", tel: "(88) 94444-5555", bairro: "Centro", esp: "Psicólogo(a)", data: d(1), hora: "08:00", prio: "Média", obs: "", status: "Agendada", envio: "nao" },
    { id: 7, nome: "Sônia Rocha", nasc: "1966-11-03", tel: "(88) 93333-6666", bairro: "Planalto", esp: "Hidroginástica", data: d(1), hora: "10:15", prio: "Baixa", obs: "", status: "Agendada", envio: "enviada" },
    { id: 8, nome: "Vera Gomes", nasc: "1974-07-22", tel: "(88) 92222-7777", bairro: "Campo Velho", esp: "Grupo de fibromialgia", data: d(1), hora: "14:00", prio: "Baixa", obs: "", status: "Cancelada", envio: "nao" },
    { id: 9, nome: "Helena Costa Barros", nasc: "1991-03-14", tel: "(88) 98877-66", bairro: "Campo Velho", esp: "Ginecologista", data: d(2), hora: "11:30", prio: "Média", obs: "", status: "Agendada", envio: "falha" },
    { id: 10, nome: "Luzia Ferreira", nasc: "1971-09-01", tel: "(88) 91111-8888", bairro: "Combate", esp: "Fisioterapia", data: d(3), hora: "09:00", prio: "Baixa", obs: "Obesidade", status: "Agendada", envio: "nao" }
  ];
}
let consultas = JSON.parse(localStorage.getItem("cr_consultas")) || dadosIniciais();
function salvar() { localStorage.setItem("cr_consultas", JSON.stringify(consultas)); }
function ordenar(lista) {
  return lista.slice().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

// ---------- Atalhos ----------
const $ = id => document.getElementById(id);
const hojeISO = () => iso(new Date());
function selo(status) { return `<span class="selo s-${status}">${ICONE_STATUS[status]} ${status}</span>`; }

// =====================================================
// LOGIN / LOGOUT (HU01, HU02)
// =====================================================
let usuarioLogado = sessionStorage.getItem("cr_usuario");

$("btn-mostrar").onclick = () => {
  const campo = $("login-senha");
  campo.type = campo.type === "password" ? "text" : "password";
  $("btn-mostrar").textContent = campo.type === "password" ? "Mostrar" : "Ocultar";
};


$("esqueci").onclick = e => {
  e.preventDefault();
  alert("Para atualizar a senha, fale com a coordenação da Casa Rosa.");
};


$("form-login").onsubmit = e => {
  e.preventDefault();
  const user = $("login-usuario").value.trim();
  const senha = $("login-senha").value;
  if (!USUARIOS[user]) { $("login-erro").textContent = "✕ Usuário não cadastrado no sistema."; return; }
  if (USUARIOS[user].senha !== senha) { $("login-erro").textContent = "✕ Senha incorreta."; return; }
  sessionStorage.setItem("cr_usuario", user);
  usuarioLogado = user;
  entrar();
};


$("btn-sair").onclick = e => {
  e.preventDefault();
  sessionStorage.removeItem("cr_usuario");
  usuarioLogado = null;
  $("app").hidden = true;
  $("login").hidden = false;
  $("form-login").reset();
  $("login-erro").textContent = "";
};

function entrar() {
  const nome = USUARIOS[usuarioLogado].nome;
  $("login").hidden = true;
  $("app").hidden = false;
  $("nome-usuario").textContent = nome + " (recepção)";
  $("boas-vindas").textContent = "Bem-vindo, " + nome;
  ir("inicio");
}

// =====================================================
// NAVEGAÇÃO
// =====================================================
document.addEventListener("click", e => {
  const alvo = e.target.closest("[data-ir]");
  if (!alvo) return;
  e.preventDefault();
  ir(alvo.dataset.ir);
});

function ir(pagina, param) {
  document.querySelectorAll(".pagina").forEach(p => (p.hidden = true));
  const nomePg = pagina === "nova" || pagina === "editar" ? "consulta" : pagina;
  $("pg-" + nomePg).hidden = false;
  document.querySelectorAll(".topo nav a").forEach(a =>
    a.classList.toggle("ativo", a.dataset.ir === (pagina === "nova" || pagina === "editar" ? "agenda" : pagina)));
  window.scrollTo(0, 0);

  if (pagina === "inicio") mostrarInicio();
  if (pagina === "agenda") mostrarAgenda();
  if (pagina === "nova") abrirFormulario(null, param);
  if (pagina === "editar") abrirFormulario(param);
  if (pagina === "horarios") mostrarHorarios();
  if (pagina === "lembretes") mostrarLembretes();
}

// =====================================================
// DASHBOARD (HU03)
// =====================================================
function mostrarInicio() {
  const hoje = new Date();
  $("data-hoje").textContent = maiuscula(hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
  const lista = ordenar(consultas.filter(c => c.data === hojeISO()));
  $("lista-hoje").innerHTML = lista.length
    ? lista.map(c => `
      <div class="item-hoje">
        <span class="hora">${c.hora}</span>
        <span class="quem">${nomeCurto(c.nome)}<small>${c.esp}</small></span>
        ${selo(c.status)}
      </div>`).join("")
    : `<p class="vazio">Não há consultas agendadas para hoje.</p>`;
}

// =====================================================
// AGENDA + FILTROS + EXPORTAR PDF (HU05, HU06, HU12)
// =====================================================
function montarFiltros() {
  const datas = [...new Set(consultas.map(c => c.data))].sort();
  const dAtual = $("filtro-data").value, sAtual = $("filtro-status").value, eAtual = $("filtro-esp").value;
  $("filtro-data").innerHTML = `<option value="">Todas as datas</option>` + datas.map(d => `<option value="${d}">${dmy(d)}</option>`).join("");
  $("filtro-status").innerHTML = `<option value="">Todos</option>` + STATUS.map(s => `<option>${s}</option>`).join("");
  $("filtro-esp").innerHTML = `<option value="">Todas</option>` + ESPECIALIDADES.slice().sort((a, b) => a.localeCompare(b)).map(s => `<option>${s}</option>`).join("");
  $("filtro-data").value = dAtual; $("filtro-status").value = sAtual; $("filtro-esp").value = eAtual;
}

function mostrarAgenda() {
  montarFiltros();
  desenharAgenda();
}

function desenharAgenda() {
  const fd = $("filtro-data").value, fs = $("filtro-status").value, fe = $("filtro-esp").value;
  let lista = ordenar(consultas).filter(c => (!fd || c.data === fd) && (!fs || c.status === fs) && (!fe || c.esp === fe));
  $("tabela-agenda").innerHTML = lista.map(c => `
    <tr>
      <td class="data-hora"><b>${dm(c.data)}</b><small>${c.hora}</small></td>
      <td>${nomeCurto(c.nome)}<small>${idade(c.nasc)} anos</small></td>
      <td>${c.tel}</td>
      <td>${c.bairro}</td>
      <td>${c.esp}</td>
      <td>${c.obs ? `<span class="tag-obs">${c.obs}</span>` : "—"}</td>
      <td>${selo(c.status)}</td>
      <td class="no-print"><a href="#" onclick="ir('editar', ${c.id}); return false;"><b>Ver / editar</b></a></td>
    </tr>`).join("");
  $("agenda-vazia").hidden = lista.length > 0;
}


["filtro-data", "filtro-status", "filtro-esp"].forEach(id => ($(id).onchange = desenharAgenda));
$("btn-pdf").onclick = () => window.print(); // na janela de impressão, escolha "Salvar como PDF"

// =====================================================
// NOVA CONSULTA / EDITAR (HU04, HU07, HU08, HU09, HU10)
// =====================================================
let editandoId = null;

// monta as "pílulas" de especialidade e prioridade uma única vez
$("f-esp").innerHTML = ESPECIALIDADES.map(e => `<label class="pill"><input type="radio" name="esp" value="${e}"> ${e}</label>`).join("");
$("f-prio").innerHTML = ["Baixa", "Média", "Alta"].map(p => `<label class="pill"><input type="radio" name="prio" value="${p}"> ${p}</label>`).join("");
$("opcoes-status").innerHTML = STATUS.map(s => `<label class="opcao-status"><input type="radio" name="st" value="${s}"> ${s}</label>`).join("");

function valorRadio(nome) {
  const r = document.querySelector(`input[name="${nome}"]:checked`);
  return r ? r.value : "";
}
function marcarRadio(nome, valor) {
  document.querySelectorAll(`input[name="${nome}"]`).forEach(r => (r.checked = r.value === valor));
}

function abrirFormulario(id, preset) {
  editandoId = id;
  $("form-erro").textContent = "";
  $("form-consulta").reset();
  $("f-atendente").value = USUARIOS[usuarioLogado].nome + " (recepção) — preenchido automaticamente";
  const nova = id === null;
  $("lado-nova").hidden = !nova;
  $("lado-editar").hidden = nova;

  if (nova) {
    $("migalha").textContent = "Agenda › Nova consulta";
    $("titulo-consulta").textContent = "Nova consulta";
    $("sub-consulta").textContent = "Preencha todos os campos marcados com *. Uma consulta é cadastrada por vez.";
    $("btn-salvar").textContent = "Cadastrar consulta";
    $("btn-voltar").textContent = "Cancelar";
    marcarRadio("prio", "Média");
    if (preset) { $("f-data").value = preset.data; $("f-hora").value = preset.hora; }
    desenharLadoNova();
  } else {
    const c = consultas.find(x => x.id === id);
    $("migalha").textContent = "Agenda › Consulta";
    $("titulo-consulta").innerHTML = `<span class="titulo-consulta">Consulta de ${c.nome} ${selo(c.status)}</span>`;
    $("sub-consulta").textContent = "Editar informações";
    $("btn-salvar").textContent = "Salvar alterações";
    $("btn-voltar").textContent = "Voltar para a agenda";
    $("f-nome").value = c.nome; $("f-nasc").value = c.nasc; $("f-tel").value = c.tel; $("f-bairro").value = c.bairro;
    $("f-data").value = c.data; $("f-hora").value = c.hora; $("f-obs").value = c.obs;
    marcarRadio("esp", c.esp); marcarRadio("prio", c.prio); marcarRadio("st", c.status);
  }
}

// lateral da nova consulta: horários do dia escolhido
function desenharLadoNova() {
  const data = $("f-data").value, hora = $("f-hora").value;
  if (!data) {
    $("lado-titulo").textContent = "Horários do dia";
    $("lado-lista").innerHTML = `<p class="pequeno">Escolha uma data para ver os horários.</p>`;
    return;
  }
  const dia = maiuscula(dataDe(data).toLocaleDateString("pt-BR", { weekday: "long" }));
  $("lado-titulo").textContent = `Horários de ${dia.split("-")[0].toLowerCase()}, ${dm(data)}`;
  const ocupadas = ordenar(consultas.filter(c => c.data === data && c.status !== "Cancelada"));
  let linhas = ocupadas.map(c => ({ hora: c.hora, html: `<span><b>${c.hora}</b> Ocupado - ${nomeCurto(c.nome)}</span>` }));
  if (hora && !ocupadas.some(c => c.hora === hora)) linhas.push({ hora, html: `<span><b>${hora}</b> Horário escolhido</span>`, escolhido: true });
  linhas.sort((a, b) => a.hora.localeCompare(b.hora));
  $("lado-lista").innerHTML = linhas.length
    ? linhas.map(l => `<div class="linha-horario ${l.escolhido ? "escolhido" : ""}">${l.html}</div>`).join("")
    : `<p class="pequeno">Nenhuma consulta neste dia.</p>`;
}
$("f-data").onchange = $("f-hora").onchange = () => { if (editandoId === null) desenharLadoNova(); };

$("btn-voltar").onclick = () => ir("agenda");

$("form-consulta").onsubmit = e => {
  e.preventDefault();
  const dados = {
    nome: $("f-nome").value.trim(), nasc: $("f-nasc").value, tel: $("f-tel").value.trim(), bairro: $("f-bairro").value.trim(),
    esp: valorRadio("esp"), data: $("f-data").value, hora: $("f-hora").value, prio: valorRadio("prio"), obs: $("f-obs").value.trim()
  };
  // todos os campos (menos observação) são obrigatórios
  const faltando = ["nome", "nasc", "tel", "bairro", "esp", "data", "hora", "prio"].some(k => !dados[k]);
  if (faltando) { $("form-erro").textContent = "Há campos de preenchimento vazios."; return; }
  // evita conflito de horário
  const conflito = consultas.some(c => c.id !== editandoId && c.status !== "Cancelada" && c.data === dados.data && c.hora === dados.hora);
  if (conflito) { $("form-erro").textContent = "Este horário já está ocupado. Escolha outro."; return; }

  if (editandoId === null) {
    const novoId = consultas.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    consultas.push({ id: novoId, ...dados, status: "Agendada", envio: "nao" });
  } else {
    Object.assign(consultas.find(c => c.id === editandoId), dados);
  }
  salvar();
  ir("agenda");
};

// alterar status (HU09)
$("btn-salvar-status").onclick = () => {
  const novo = valorRadio("st");
  if (!novo) return;
  const c = consultas.find(x => x.id === editandoId);
  c.status = novo;
  salvar();
  ir("agenda");
};

// janela de confirmação (excluir / cancelar)
let acaoModal = null;
function abrirModal(cfg) {
  const c = consultas.find(x => x.id === editandoId);
  $("modal-icone").textContent = cfg.icone;
  $("modal-titulo").textContent = cfg.titulo;
  $("modal-resumo").innerHTML = `<b>${c.nome}</b><small>${c.esp} · ${dmy(c.data)} às ${c.hora}</small>`;
  $("modal-texto").textContent = cfg.texto;
  $("modal-ok").textContent = cfg.botao;
  $("modal-ok").className = "btn " + cfg.classe;
  acaoModal = cfg.acao;
  $("modal").hidden = false;
}
$("modal-voltar").onclick = () => ($("modal").hidden = true);
$("modal-ok").onclick = () => { $("modal").hidden = true; acaoModal(); };

$("btn-excluir").onclick = () => abrirModal({
  icone: "🗑️", titulo: "Excluir esta consulta?", botao: "Sim, excluir", classe: "btn-primario",
  texto: "Ela será removida da agenda e não dá para desfazer.",
  acao: () => { consultas = consultas.filter(c => c.id !== editandoId); salvar(); ir("agenda"); }
});
$("btn-cancelar").onclick = () => abrirModal({
  icone: "⚠️", titulo: "Cancelar esta consulta?", botao: "Sim, cancelar consulta", classe: "btn-amarelo",
  texto: 'Ela continua registrada com o status "Cancelada" e o horário fica livre para outra paciente.',
  acao: () => { consultas.find(c => c.id === editandoId).status = "Cancelada"; salvar(); ir("agenda"); }
});

// =====================================================
// HORÁRIOS (HU13)
// =====================================================
let semanaOffset = 0;

function segundaDaSemana() {
  const h = new Date();
  const dia = h.getDay(); // 0 = domingo
  let seg = somarDias(h, -((dia + 6) % 7));
  if (dia === 0 || dia === 6) seg = somarDias(seg, 7); // fim de semana: mostra a próxima
  return somarDias(seg, semanaOffset * 7);
}

function mostrarHorarios() {
  const seg = segundaDaSemana();
  const dias = [0, 1, 2, 3, 4].map(i => somarDias(seg, i));
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const ini = dias[0], fim = dias[4];
  $("semana-titulo").textContent = ini.getMonth() === fim.getMonth()
    ? `${ini.getDate()} a ${fim.getDate()} de ${meses[fim.getMonth()]}`
    : `${ini.getDate()} de ${meses[ini.getMonth()]} a ${fim.getDate()} de ${meses[fim.getMonth()]}`;

  $("horarios-cab").innerHTML = `<tr><th>Horário</th>${dias.map((d, i) =>
    `<th class="${iso(d) === hojeISO() ? "hoje-col" : ""}">${DIAS[i]} ${String(d.getDate()).padStart(2, "0")}</th>`).join("")}</tr>`;

  $("horarios-corpo").innerHTML = HORAS.map(h => `<tr><td>${h}</td>${dias.map(d => {
    const data = iso(d);
    // consulta cancelada não bloqueia o horário
    const ocupado = consultas.some(c => c.data === data && c.status !== "Cancelada" && c.hora.slice(0, 2) === h.slice(0, 2));
    return ocupado
      ? `<td><span class="celula ocupado">● Ocupado</span></td>`
      : `<td><button class="celula livre" onclick="ir('nova', {data:'${data}', hora:'${h}'})">+ Livre</button></td>`;
  }).join("")}</tr>`).join("");
}
$("sem-ant").onclick = () => { semanaOffset--; mostrarHorarios(); };
$("sem-prox").onclick = () => { semanaOffset++; mostrarHorarios(); };

// =====================================================
// LEMBRETES (HU11)
// =====================================================
let selecionadas = new Set();

function mostrarLembretes() {
  selecionadas.clear();
  $("lembrete-aviso").textContent = "";
  montarModelos();
  desenharLembretes();
}

function desenharLembretes() {
  const lista = ordenar(consultas.filter(c => c.status !== "Cancelada" && c.data >= hojeISO()));
  $("tabela-lembretes").innerHTML = lista.map(c => {
    let envio = `<span class="selo s-Nao">● Não enviada</span>`;
    if (c.envio === "enviada") envio = `<span class="selo s-Enviada">✓ Enviada</span>`;
    if (c.envio === "falha") envio = `<span class="selo s-Falha">✕ Falha no envio</span><small style="color:var(--rosa)">Número de WhatsApp inválido</small>`;
    return `<tr>
      <td><input type="checkbox" ${selecionadas.has(c.id) ? "checked" : ""} onchange="marcarLembrete(${c.id}, this.checked)"></td>
      <td>${nomeCurto(c.nome)}<small>${c.tel}</small></td>
      <td>${dm(c.data)} · ${c.hora}<small>${c.esp}</small></td>
      <td>${envio}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="vazio">Não há consultas para lembrar.</td></tr>`;
  $("qtd-sel").textContent = selecionadas.size;
}
function marcarLembrete(id, marcado) {
  marcado ? selecionadas.add(id) : selecionadas.delete(id);
  $("qtd-sel").textContent = selecionadas.size;
}

function montarModelos() {
  const atual = $("modelo-select").value;
  $("modelo-select").innerHTML = modelos.map((m, i) => `<option value="${i}">${m.nome}</option>`).join("");
  if (atual) $("modelo-select").value = atual;
  $("modelo-previa").textContent = modelos[$("modelo-select").value || 0].texto;
}
$("modelo-select").onchange = montarModelos;
$("editar-modelos").onclick = e => {
  e.preventDefault();
  const i = $("modelo-select").value || 0;
  const novo = prompt("Edite o texto do modelo.\nUse [nome], [especialidade], [data] e [hora]:", modelos[i].texto);
  if (novo && novo.trim()) {
    modelos[i].texto = novo.trim();
    localStorage.setItem("cr_modelos", JSON.stringify(modelos));
    montarModelos();
  }
};

$("btn-enviar").onclick = () => {
  $("lembrete-aviso").textContent = "";
  if (selecionadas.size === 0) { $("lembrete-aviso").textContent = "Selecione pelo menos uma paciente."; return; }
  const modelo = modelos[$("modelo-select").value || 0].texto;
  let falhas = 0;

  consultas.filter(c => selecionadas.has(c.id)).forEach(c => {
    const numero = c.tel.replace(/\D/g, "");
    if (numero.length < 10 || numero.length > 11) { c.envio = "falha"; falhas++; return; }
    const msg = modelo.replace("[nome]", c.nome.split(" ")[0]).replace("[especialidade]", c.esp)
      .replace("[data]", dm(c.data)).replace("[hora]", c.hora);
    window.open("https://wa.me/55" + numero + "?text=" + encodeURIComponent(msg), "_blank");
    c.envio = "enviada";
  });
  salvar();
  selecionadas.clear();
  desenharLembretes();
  if (falhas) $("lembrete-aviso").textContent = falhas + " mensagem(ns) não enviada(s): número de WhatsApp inválido.";
};

// =====================================================
// INÍCIO DO SISTEMA
// =====================================================
if (usuarioLogado && USUARIOS[usuarioLogado]) entrar();
