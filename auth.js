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

const AUTH_API_URL = "https://script.google.com/macros/s/AKfycby-4fOy9HAEmCUMndlLrPWJC7Gq62K5kSd3VWlo3EHEcug_68A5Uyv8hzzbJHtxh0t-Ig/exec";

async function protegerPagina(niveisPermitidos) {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_URL}?type=validate&token=${encodeURIComponent(token)}`);
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
        console.error("Não foi possível validar o acesso:", err);
        window.location.href = "index.html";
    }
}