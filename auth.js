// =========================================================
// auth.js — Controle de acesso por nível (admin_sc, usuario_sc,
// admin_rs, usuario_rs)
//
// Uso em cada página protegida (dentro do <head>, o quanto antes):
//
//   <script src="auth.js"></script>
//   <script>protegerPagina(["admin_sc", "usuario_sc"]);</script>
//
// A página também precisa ter, no <style>, a regra:
//   body{ opacity:0; transition:opacity .15s ease; }
//   body.auth-ready{ opacity:1; }
// (isso evita "piscar" o conteúdo antes de confirmar o acesso)
// =========================================================

// Mesmo endpoint usado no login (index.html), cadastro e demais páginas.
// Evita depender de um segundo deployment do Apps Script que pode ficar
// desatualizado em relação ao Code.gs principal.
const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbwPe5hUMTqNdlbLAj3DhkgBeYlhwqb4p8AWfoRcO7XCoPXvUEbrzUQVVky2AZfqHPZr/exec";

// Tempo máximo de espera pela validação antes de desistir e voltar pro login.
// Isso garante que a página NUNCA fique travada em branco pra sempre.
const AUTH_TIMEOUT_MS = 8000;

async function protegerPagina(niveisPermitidos) {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
        const res = await fetch(
            `${AUTH_API_URL}?type=validate&token=${encodeURIComponent(token)}`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!data.valid) {
            localStorage.removeItem("token");
            localStorage.removeItem("nivel");
            window.location.href = "index.html";
            return;
        }

        const nivel = String(data.nivel || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_"); // aceita "Admin SC" (planilha) e "admin_sc" (select) igualmente
        localStorage.setItem("nivel", nivel);

        if (!niveisPermitidos.includes(nivel)) {
            // Usuário autenticado, mas sem permissão para esta página específica.
            window.location.href = "painel.html";
            return;
        }

        document.addEventListener("DOMContentLoaded", () => {
            document.body.classList.add("auth-ready");
        });

        if (document.readyState !== "loading") {
            document.body.classList.add("auth-ready");
        }

    } catch (err) {
        clearTimeout(timeoutId);
        console.error("Não foi possível validar o acesso:", err);
        // Falha de rede, timeout, ou resposta inválida: nunca deixa a
        // página travada em branco — volta pro login.
        window.location.href = "index.html";
    }
}