"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const capabilities = [
  {
    number: "01",
    title: "Estrategia de producto",
    copy: "Convertimos una oportunidad de negocio en una hoja de ruta clara, priorizada y posible.",
  },
  {
    number: "02",
    title: "Diseño UX/UI",
    copy: "Diseñamos experiencias que reducen fricción, expresan el valor y se sienten inevitables.",
  },
  {
    number: "03",
    title: "Software a medida",
    copy: "Construimos sistemas alrededor de la operación real, no de plantillas genéricas.",
  },
  {
    number: "04",
    title: "SaaS y plataformas",
    copy: "Arquitecturas seguras y escalables para productos que deben evolucionar sin detenerse.",
  },
  {
    number: "05",
    title: "Ecommerce",
    copy: "Experiencias de compra rápidas y memorables, conectadas con pagos e inventario.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    revealItems.forEach((item) => revealObserver.observe(item));

    const updateProgress = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(distance > 0 ? window.scrollY / distance : 0);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />

      <header className="site-header">
        <nav className="nav-shell" aria-label="Navegación principal">
          <a className="brand" href="#inicio" aria-label="Devtecia, inicio" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            Devtecia
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>

          <div className={`nav-menu ${menuOpen ? "is-open" : ""}`} id="main-menu">
            <a href="#servicios" onClick={closeMenu}>Servicios</a>
            <a href="#proyectos" onClick={closeMenu}>Proyectos</a>
            <a href="#metodo" onClick={closeMenu}>Método</a>
          </div>

          <a className="nav-cta" href="mailto:info@devtecia.com?subject=Quiero%20iniciar%20un%20proyecto">
            Hablemos <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <Image
          className="hero-image"
          src="/devtecia-software-studio-photo.png"
          alt="Equipo de producto digital diseñando y desarrollando una plataforma de software"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-wash" />
        <div className="hero-grain" />

        <div className="hero-index" aria-hidden="true">
          <span>Estudio digital</span>
          <span>Producto · Diseño · Tecnología</span>
        </div>

        <div className="hero-card">
          <p className="kicker"><span /> Producto · Diseño · Tecnología</p>
          <h1 id="hero-title">Software que mueve negocios reales.</h1>
          <p className="hero-copy">
            Diseñamos y construimos productos digitales con la claridad estratégica, el carácter
            visual y la ingeniería que necesitan para crecer.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="mailto:info@devtecia.com?subject=Quiero%20iniciar%20un%20proyecto">
              Empezar un proyecto <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#proyectos">
              Ver nuestro trabajo <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <a className="scroll-cue" href="#vision" aria-label="Descubrir la visión de Devtecia">
          <span>Explorar</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <div className="marquee" aria-label="Servicios principales">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="marquee-set" aria-hidden={copy === 1} key={copy}>
              <span>Producto digital</span><i />
              <span>SaaS</span><i />
              <span>Ecommerce</span><i />
              <span>Software a medida</span><i />
              <span>Experiencias que convierten</span><i />
            </div>
          ))}
        </div>
      </div>

      <section className="vision section-pad" id="vision">
        <div className="section-number" data-reveal>01 — Visión</div>
        <div className="vision-grid">
          <h2 className="display-title" data-reveal>
            Una idea valiosa merece más que una interfaz bonita.
          </h2>
          <div className="vision-copy" data-reveal>
            <p>
              La tecnología solo crea valor cuando entiende el negocio. Por eso conectamos
              estrategia, diseño e ingeniería desde el primer día.
            </p>
            <p>
              El resultado no es una suma de entregables: es un producto coherente, útil y listo
              para evolucionar.
            </p>
          </div>
        </div>

        <div className="manifesto" data-reveal>
          <span className="manifesto-orbit orbit-one" />
          <span className="manifesto-orbit orbit-two" />
          <div className="manifesto-core">
            <span>Una sola dirección</span>
            <strong>Ideas coordinadas.<br />Productos completos.</strong>
          </div>
          <div className="floating-word word-one">Estrategia</div>
          <div className="floating-word word-two">Experiencia</div>
          <div className="floating-word word-three">Tecnología</div>
        </div>
      </section>

      <section className="capabilities section-pad" id="servicios">
        <div className="section-number light" data-reveal>02 — Capacidades</div>
        <div className="capabilities-intro">
          <h2 className="display-title" data-reveal>Cinco disciplinas.<br />Un único resultado.</h2>
          <p data-reveal>
            Un equipo senior acompaña cada decisión, desde la definición del producto hasta su
            evolución en producción.
          </p>
        </div>

        <div className="capability-list">
          {capabilities.map((capability) => (
            <article className="capability-row" data-reveal key={capability.number}>
              <span>{capability.number}</span>
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="work section-pad" id="proyectos">
        <div className="section-number" data-reveal>03 — Trabajo seleccionado</div>
        <div className="work-intro">
          <h2 className="display-title" data-reveal>Productos que ya están moviendo negocios.</h2>
          <p data-reveal>
            Casos reales, construidos alrededor de operaciones reales. Sin métricas decorativas ni
            promesas inventadas.
          </p>
        </div>

        <article className="case-study case-ventex" data-reveal>
          <div className="case-copy">
            <div className="case-meta"><span>01</span><span>SaaS · Operaciones</span></div>
            <Image className="ventex-logo" src="/ventex-logo.svg" alt="Ventex" width={174} height={44} />
            <h3>El sistema operativo para administrar un negocio.</h3>
            <p>
              Punto de venta, inventario, finanzas y clientes en una sola plataforma, diseñada para
              tiendas, barberías y negocios de servicios.
            </p>
            <div className="case-tags"><span>Producto</span><span>UX/UI</span><span>Desarrollo SaaS</span></div>
            <a className="case-link" href="https://www.ventex.app" target="_blank" rel="noreferrer">
              Visitar Ventex <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="ventex-stage" aria-label="Representación de la interfaz de Ventex">
            <div className="dashboard-window">
              <div className="dashboard-topbar">
                <div className="dashboard-brand"><b>V</b><span>Ventex</span></div>
                <div className="dashboard-search">Buscar en Ventex</div>
                <div className="dashboard-avatar">AJ</div>
              </div>
              <div className="dashboard-body">
                <aside className="dashboard-sidebar">
                  <span className="active">Resumen</span><span>Ventas</span><span>Inventario</span>
                  <span>Clientes</span><span>Finanzas</span>
                </aside>
                <div className="dashboard-main">
                  <div className="dashboard-heading"><div><small>Hoy</small><strong>Resumen del negocio</strong></div><button>Nueva venta</button></div>
                  <div className="metric-grid">
                    <div><small>Ventas</small><strong>$4.280.000</strong><em>+12.4%</em></div>
                    <div><small>Beneficio</small><strong>$1.760.000</strong><em>+8.2%</em></div>
                    <div><small>Stock bajo</small><strong>12</strong><em className="warn">Revisar</em></div>
                  </div>
                  <div className="dashboard-chart">
                    <div className="chart-head"><strong>Ventas esta semana</strong><span>Últimos 7 días</span></div>
                    <div className="chart-bars" aria-hidden="true">
                      {[42, 68, 52, 80, 65, 92, 74].map((height, index) => (
                        <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="case-study case-mega" data-reveal>
          <div className="case-copy">
            <div className="case-meta"><span>02</span><span>Ecommerce</span></div>
            <div className="mega-wordmark">megaservices<span>.</span></div>
            <h3>Una experiencia de compra clara, rápida y adaptable.</h3>
            <p>
              Ecommerce desarrollado para convertir el catálogo en una experiencia digital directa,
              consistente y preparada para crecer.
            </p>
            <div className="case-tags"><span>Ecommerce</span><span>Experiencia responsive</span><span>Desarrollo web</span></div>
            <a className="case-link" href="https://megaservices.store" target="_blank" rel="noreferrer">
              Visitar Megaservices <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="store-stage" aria-label="Representación de la experiencia ecommerce de Megaservices">
            <div className="store-window">
              <div className="store-nav"><b>megaservices.</b><div><span>Productos</span><span>Novedades</span><span>Nosotros</span></div><i>Bag · 02</i></div>
              <div className="store-hero">
                <span className="store-label">Selección de temporada</span>
                <h4>Todo lo que necesitás,<br />en un solo lugar.</h4>
                <button>Explorar colección ↗</button>
              </div>
              <div className="product-strip">
                <div className="product-card product-blue"><span>01</span><i /></div>
                <div className="product-card product-coral"><span>02</span><i /></div>
                <div className="product-card product-lime"><span>03</span><i /></div>
              </div>
            </div>
          </div>
        </article>

        <div className="next-project" data-reveal>
          <p>El próximo caso puede ser el tuyo.</p>
          <a href="mailto:info@devtecia.com?subject=Quiero%20crear%20el%20próximo%20caso%20de%20Devtecia">
            Contanos qué querés construir <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="method" id="metodo">
        <Image
          className="method-image"
          src="/devtecia-software-system.png"
          alt="Ecosistema visual de interfaces, datos y arquitectura de software conectados"
          fill
          sizes="100vw"
        />
        <div className="method-overlay" />
        <div className="method-card" data-reveal>
          <p className="kicker kicker-dark"><span /> Nuestro método</p>
          <h2>La complejidad se coordina. No se maquilla.</h2>
          <p>
            Trabajamos en ciclos cortos, con decisiones visibles y una dirección compartida entre
            negocio, diseño y tecnología.
          </p>
          <ol>
            <li><span>01</span><div><strong>Entender</strong><small>Negocio, usuarios y operación.</small></div></li>
            <li><span>02</span><div><strong>Dar forma</strong><small>Prioridades, experiencia y sistema.</small></div></li>
            <li><span>03</span><div><strong>Construir</strong><small>Software probado y evolución continua.</small></div></li>
          </ol>
        </div>
      </section>

      <section className="closing" id="contacto">
        <p className="kicker" data-reveal><span /> El siguiente capítulo</p>
        <h2 data-reveal>Construyamos algo que valga la pena recordar.</h2>
        <a className="closing-link" href="mailto:info@devtecia.com?subject=Conversemos%20sobre%20mi%20proyecto" data-reveal>
          info@devtecia.com <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true"><span /></span>Devtecia</a>
        <p>Productos digitales con dirección.<br />Estrategia, diseño y tecnología.</p>
        <div className="footer-links"><a href="#servicios">Servicios</a><a href="#proyectos">Proyectos</a><a href="#metodo">Método</a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Devtecia</span><span>Diseño y tecnología, sin ruido.</span></div>
      </footer>
    </main>
  );
}
