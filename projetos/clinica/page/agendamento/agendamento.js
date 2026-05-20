const SUPABASE_URL =
"https://zouzolqaegaughjchwor.supabase.co";

const SUPABASE_KEY =
"SEU_ANON_KEY_AQUI";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

document.addEventListener("DOMContentLoaded", () => {

  const form =
    document.getElementById("formAgendamento");

  const medicoSelect =
    document.getElementById("medico");

  /* =========================
     CARREGAR MÉDICOS
  ========================= */

  async function carregarMedicos() {

    medicoSelect.innerHTML =
      `<option value="">Carregando médicos...</option>`;

    const { data, error } = await client
      .from("medicos")
      .select("id, nome, especialidade")
      .eq("ativo", true);

    if (error) {

      console.error("Erro médicos:", error);

      medicoSelect.innerHTML =
        `<option value="">Erro ao carregar</option>`;

      return;
    }

    medicoSelect.innerHTML =
      `<option value="">Selecione</option>`;

    if (!data || data.length === 0) {

      medicoSelect.innerHTML =
        `<option value="">Nenhum médico encontrado</option>`;

      return;
    }

    data.forEach((medico) => {

      const option =
        document.createElement("option");

      option.value = medico.nome;

      option.textContent =
        `${medico.nome} - ${medico.especialidade}`;

      medicoSelect.appendChild(option);

    });

  }

  carregarMedicos();

  /* =========================
     AGENDAMENTO
  ========================= */

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const nome =
      document.getElementById("nome").value.trim();

    const telefone =
      document.getElementById("telefone").value.trim();

    const email =
      document.getElementById("email").value.trim();

    const especialidade =
      document.getElementById("especialidade").value;

    const medico =
      document.getElementById("medico").value;

    const dataConsulta =
      document.getElementById("data").value;

    const horario =
      document.getElementById("horario").value;

    const observacoes =
      document.getElementById("observacoes").value.trim();

    /* VALIDAÇÃO */

    if (
      !nome ||
      !telefone ||
      !email ||
      !especialidade ||
      !medico ||
      !dataConsulta ||
      !horario
    ) {

      alert("Preencha todos os campos.");

      return;
    }

    try {

      /* =========================
         PACIENTE
      ========================= */

      const {
        data: paciente,
        error: erroPaciente
      } = await client
        .from("pacientes")
        .insert([
          {
            nome,
            telefone,
            email,
            observacoes
          }
        ])
        .select()
        .single();

      if (erroPaciente) {

        console.error("Erro paciente:", erroPaciente);

        alert("Erro ao salvar paciente.");

        return;
      }

      /* =========================
         CONSULTA
      ========================= */

      const {
        data: consulta,
        error: erroConsulta
      } = await client
        .from("consultas")
        .insert([
          {
            paciente_id: paciente.id,

            paciente_nome: nome,
            paciente_telefone: telefone,
            paciente_email: email,

            medico_nome: medico,
            especialidade,

            data_consulta: dataConsulta,
            horario,

            observacoes,
            status: "agendado"
          }
        ])
        .select()
        .single();

      if (erroConsulta) {

        console.error("Erro consulta:", erroConsulta);

        alert("Erro ao salvar consulta.");

        return;
      }

      /* =========================
         NOTIFICAÇÃO
      ========================= */

      const { error: erroNotificacao } =
        await client
          .from("notificacoes")
          .insert([
            {
              consulta_id: consulta.id,
              tipo: "agendamento",
              mensagem:
                `Nova consulta agendada para ${nome}`
            }
          ]);

      if (erroNotificacao) {

        console.error(
          "Erro notificação:",
          erroNotificacao
        );

      }

      /* =========================
         SUCESSO
      ========================= */

      form.innerHTML = `
      
        <div class="form-success">

          <div class="success-icon">
            ✓
          </div>

          <h3>
            Consulta agendada!
          </h3>

          <p>
            Entraremos em contato em breve.
          </p>

        </div>

      `;

    } catch (err) {

      console.error("Erro geral:", err);

      alert("Erro inesperado.");

    }

  });

});