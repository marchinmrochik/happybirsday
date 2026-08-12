"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import CharacterPreviewCanvas from "@/src/components/CharacterPreviewCanvas";
import CharacterModelsCanvas from "@/src/components/CharacterModelsCanvas";
import GarageSceneCanvas from "@/src/components/GarageSceneCanvas";
import PortalVerseCanvas from "@/src/components/PortalVerseCanvas";
import {
  customizationOptions,
  defaultCharacterCustomization,
  type CharacterCustomization
} from "@/src/data/characterCustomization";
import { usePortalAudio } from "@/src/hooks/usePortalAudio";
import {
  achievements,
  birthdayConfig,
  decorativePhotos,
  finalDialog,
  labReadouts,
  profileStats,
  scannerLines,
  type GamePhase
} from "@/src/data/story";

const analysisStatGlyphs = ["\u25c9", "\u231b", "\u265b", "\u25ce", "\u2605", "\u25c7", "\u2697"] as const;

export default function BirthdayExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<GamePhase>("scanner");
  const [scannerReady, setScannerReady] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalClosed, setFinalClosed] = useState(false);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [characterCustomization, setCharacterCustomization] = useState<CharacterCustomization>(defaultCharacterCustomization);
  const [portalCharging, setPortalCharging] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const { boardPop, portalSquelch } = usePortalAudio();
  const activePhoto = decorativePhotos.find((photo) => photo.id === openPhotoId) ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  useEffect(() => {
    setOpenPhotoId(null);
    setCustomizerOpen(false);
  }, [phase]);

  useEffect(() => {
    if (!activePhoto) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPhotoId(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activePhoto]);

  useEffect(() => {
    if (!customizerOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCustomizerOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [customizerOpen]);

  useEffect(() => {
    if (phase !== "scanner") {
      return;
    }

    setScannerReady(false);

    const ctx = gsap.context(() => {
      const diagnosticStagger = 0.62;
      const correctionPause = 0.88;
      const correctionLineIndex = scannerLines.findIndex((line) => line.text === "Ошибка исправлена.");
      const profileRevealDelay =
        Math.max(0, scannerLines.length - 1) * diagnosticStagger + (correctionLineIndex >= 0 ? correctionPause : 0);

      gsap.set([".scanner-kicker", ".scanner-title", ".scanner-subtitle", ".profile-card", ".profile-stat", ".scanner-cta"], {
        autoAlpha: 0,
        y: 18
      });
      gsap.set(".scanner-line", { autoAlpha: 0, x: -18 });

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      const diagnosticRows = gsap.utils.toArray<HTMLElement>(".scanner-line");
      timeline
        .to(".scanner-kicker", { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(".scanner-title", { autoAlpha: 1, y: 0, duration: 0.75 }, "-=0.2")
        .to(".scanner-subtitle", { autoAlpha: 1, y: 0, duration: 0.55 }, "-=0.28")
        .addLabel("diagnostics", "+=0.2");

      diagnosticRows.forEach((row, index) => {
        const delayedByCorrection = correctionLineIndex >= 0 && index >= correctionLineIndex ? correctionPause : 0;
        const revealAt = index * diagnosticStagger + delayedByCorrection;

        timeline.to(row, { autoAlpha: 1, x: 0, duration: 0.32 }, `diagnostics+=${revealAt}`);
      });

      timeline
        .to(".profile-card", { autoAlpha: 1, y: 0, duration: 0.55 }, `diagnostics+=${profileRevealDelay}`)
        .to(".profile-stat", { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.12 }, "-=0.12")
        .call(() => setScannerReady(true))
        .to(".scanner-cta", { autoAlpha: 1, y: 0, duration: 0.45 }, "+=0.08");
    }, rootRef);

    return () => ctx.revert();
  }, [phase]);

  useEffect(() => {
    if (phase !== "travel") {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase("lab");
      boardPop();
    }, 2850);

    return () => window.clearTimeout(timer);
  }, [boardPop, phase]);

  useEffect(() => {
    if (phase !== "portal") {
      setPortalCharging(false);
      setPortalReady(false);
    }
  }, [phase]);

  useEffect(() => {
    if (!portalCharging || phase !== "portal") {
      return;
    }

    const portalTimer = window.setTimeout(() => {
      setPortalCharging(false);
      setPortalReady(true);
      portalSquelch(1.5);
      startMusic();
    }, 1180);

    return () => window.clearTimeout(portalTimer);
  }, [phase, portalCharging, portalSquelch]);

  useEffect(() => {
    if (phase !== "lab") {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(".lab-reveal", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" });
    }, rootRef);

    return () => ctx.revert();
  }, [phase]);

  useEffect(() => {
    if (phase !== "analysis") {
      return;
    }

    setAnalysisComplete(false);

    const ctx = gsap.context(() => {
      gsap.set(
        [".analysis-shell", ".analysis-profile-header", ".analysis-stat", ".analysis-portrait", ".achievements-title", ".achievement", ".analysis-complete"],
        { autoAlpha: 0, y: 18 }
      );
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(".analysis-shell", { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(".analysis-profile-header", { autoAlpha: 1, y: 0, duration: 0.42 })
        .to(".analysis-stat", { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.13 })
        .to(".analysis-portrait", { scale: 1, autoAlpha: 1, duration: 0.5 }, "-=0.1")
        .to(".achievements-title", { autoAlpha: 1, y: 0, duration: 0.32 })
        .to(".achievement", { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.32 })
        .to(".analysis-complete", { autoAlpha: 1, y: 0, duration: 0.5 });
    }, rootRef);

    const completeTimer = window.setTimeout(() => {
      setAnalysisComplete(true);
      portalSquelch(1.6);
    }, 7600);
    const finalTimer = window.setTimeout(() => {
      setPhase("final");
    }, 18800);

    return () => {
      ctx.revert();
      window.clearTimeout(completeTimer);
      window.clearTimeout(finalTimer);
    };
  }, [phase, portalSquelch]);

  useEffect(() => {
    if (phase !== "final") {
      setFinalClosed(false);
      return;
    }

    setFinalClosed(false);
    portalSquelch(2);

    const ctx = gsap.context(() => {
      gsap.set(".final-dialog-line", { autoAlpha: 0, y: 16 });
      gsap.to(".final-dialog-line", { autoAlpha: 1, y: 0, duration: 0.42, stagger: 1.45, delay: 0.65, ease: "power3.out" });
    }, rootRef);

    const closeTimer = window.setTimeout(() => {
      setFinalClosed(true);
      portalSquelch(1.25);
    }, 11800);

    return () => {
      ctx.revert();
      window.clearTimeout(closeTimer);
    };
  }, [phase, portalSquelch]);

  useEffect(() => {
    if (!finalClosed || phase !== "final") {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".final-epilogue", ".final-stinger"],
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.22, ease: "power3.out" }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [finalClosed, phase]);

  const openPortal = () => {
    portalSquelch(1.35);
    setPortalCharging(false);
    setPortalReady(false);
    setPhase("portal");
  };

  const firePortalGun = () => {
    if (portalCharging || portalReady) {
      return;
    }

    portalSquelch(1.05);
    setPortalCharging(true);
  };

  const enterPortal = () => {
    if (!portalReady) {
      return;
    }

    portalSquelch(1.8);
    setPhase("travel");
  };

  const startAnalysis = () => {
    boardPop();
    setPhase("analysis");
  };

  const openPhoto = (photoId: string) => {
    boardPop();
    setOpenPhotoId(photoId);
  };

  const openCustomizer = () => {
    boardPop();
    setCustomizerOpen(true);
  };

  const updateCustomization = <Key extends keyof CharacterCustomization>(key: Key, value: CharacterCustomization[Key]) => {
    setCharacterCustomization((current) => ({
      ...current,
      [key]: value
    }));
  };

  const startMusic = () => {
    const music = musicRef.current;

    if (!music) {
      return;
    }

    music.volume = 0.16;
    void music.play().catch(() => {
      // Browser autoplay policies can still block audio in some preview contexts.
    });
  };

  return (
    <main className={`birthday-game phase-${phase}`} ref={rootRef}>
      <audio ref={musicRef} src="/assets/audio/rick-and-morty-theme.mp3" preload="auto" loop />
      <PortalVerseCanvas
        phase={phase}
        analysisComplete={analysisComplete}
        portalCharging={portalCharging}
        portalReady={portalReady}
        onPortalGunClick={firePortalGun}
        onPortalClick={enterPortal}
      />
      <CharacterModelsCanvas isClosed={phase !== "final" || finalClosed} />
      <div className="game-grain" aria-hidden="true" />
      <div className="energy-haze" aria-hidden="true" />

      {phase === "scanner" && (
        <section className="scanner-screen" aria-label="Межпространственный сканер">
          <div className="scanner-noise" aria-hidden="true" />
          <div className="scanner-panel">
            <header className="scanner-topbar">
              <div className="scanner-brand">
                <span className="scanner-brand-mark" aria-hidden="true" />
                <span className="scanner-kicker">Interdimensional diagnostic unit</span>
              </div>
              <span className="scanner-signal">
                <span aria-hidden="true" />
                Сигнал: стабильный
              </span>
            </header>

            <div className="scanner-hero-copy">
              <h1 className="scanner-title">Межпространственный сканер</h1>
              <span className="scanner-subtitle">Древняя система просыпается, ловит сигналы и проверяет редкий объект мультивселенной.</span>
            </div>

            <div className="scanner-grid">
              <div className="scanner-log" aria-label="Лог сканирования">
                <h2 className="scanner-card-title">
                  <span className="scanner-card-icon" aria-hidden="true" />
                  Диагностика системы
                </h2>
                {scannerLines.map((line) => (
                  <p className={`scanner-line ${line.status === "error" ? "is-error" : ""}`} key={line.text}>
                    <span />
                    {line.text}
                  </p>
                ))}
              </div>

              <div className="profile-card" aria-label="Профиль именинника">
                <h2 className="scanner-card-title">
                  <span className="scanner-card-icon is-profile" aria-hidden="true" />
                  Профиль объекта
                </h2>
                {profileStats.slice(0, 4).map((stat) => (
                  <div className="profile-stat" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}

                <button className="scanner-cta" type="button" onClick={openPortal} data-ready={scannerReady}>
                  {birthdayConfig.scannerButton}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {phase === "portal" && (
        <section className={`portal-screen ${portalCharging ? "is-charging" : ""} ${portalReady ? "is-ready" : ""}`} aria-label="Межпространственный портал">
          <div className="portal-copy">
            <p>{portalReady ? "Разлом сформирован" : portalCharging ? "Прошиваем пространство" : "⚡ Портальная пушка заряжена ⚡"}</p>
            <h1>{portalReady ? "Портал открыт" : "Дай импульс!"}</h1>
            <span className={!portalReady && !portalCharging ? "portal-action-hint" : undefined}>
              {portalReady ? "Теперь в зеленый разлом - и лаборатория начнет исследование." : portalCharging ? "Стабилизация пространственного разлома..." : "Нажми на портальную пушку"}
            </span>
          </div>

        </section>
      )}

      {phase === "travel" && (
        <section className="travel-screen" aria-label="Путешествие через тоннель">
          <div className="travel-tunnel" aria-hidden="true" />
          <p className="travel-caption">Межпространственный тоннель: скорость неприличная, стабильность условная...</p>
        </section>
      )}

      {(phase === "lab" || phase === "analysis") && (
        <section className={`lab-screen ${phase === "analysis" ? "is-analyzing" : ""}`} aria-label="Гаражная лаборатория">
          <GarageSceneCanvas
            isAnalyzing={phase === "analysis"}
            customization={characterCustomization}
            onAnalysisStart={startAnalysis}
            onPhotoOpen={openPhoto}
            onCustomizerOpen={openCustomizer}
          />
          <div className="lab-image-vignette" aria-hidden="true" />
          <div className="steam steam-a" aria-hidden="true" />
          <div className="steam steam-b" aria-hidden="true" />
          <div className="hologram-panel holo-a lab-reveal" aria-hidden="true">DIMENSION MAP</div>
          <div className="hologram-panel holo-b lab-reveal" aria-hidden="true">ANOMALY 30</div>
          <div className="time-travel-label lab-reveal" aria-hidden="true">TIME TRAVEL STUFF</div>

          <header className="lab-brief lab-reveal">
            <p>{birthdayConfig.labTitle}</p>
            <h1>Лаборатория запущена</h1>
            <span>Фотографии уже в деле, приборы шумят, а на рабочем столе ждут колбы запуска анализа.</span>
          </header>

          <div className="lab-readouts lab-reveal" aria-hidden="true">
            {labReadouts.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          {phase === "analysis" && (
            <article className="analysis-shell" aria-label="Результаты анализа">
              <header className="analysis-profile-header">
                <span className="analysis-scan-badge">
                  <i aria-hidden="true">⚛</i>
                  Профиль отсканирован
                  <i aria-hidden="true">⚛</i>
                </span>
                <h1>{birthdayConfig.celebrantName}</h1>
                <p>✦ Редкий экземпляр мультивселенной ✦</p>
              </header>

              <div className="analysis-grid">
                <div className="analysis-stats">
                  {profileStats.map((stat, index) => (
                    <div className="analysis-stat" key={stat.label}>
                      <span className={`analysis-stat-icon analysis-stat-icon-${index + 1}`} aria-hidden="true">
                        {analysisStatGlyphs[index]}
                      </span>
                      <span className="analysis-stat-copy">
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>

                <aside className="analysis-portrait">
                  <span className="analysis-level">LVL {birthdayConfig.age}</span>
                  <div className="analysis-portrait-art" aria-hidden="true">
                    <img src="/assets/analysis/roman-portrait.png" alt="" />
                  </div>
                  <strong>{birthdayConfig.celebrantName}</strong>
                  <span className="analysis-rank">Легендарный экземпляр</span>
                  <span className="analysis-stars" aria-label="Легендарный рейтинг: шесть звёзд">
                    ★★★★★★
                  </span>
                </aside>
              </div>

              <h2 className="achievements-title">
                <span aria-hidden="true">⚗</span>
                Достижения разблокированы
                <span aria-hidden="true">⚗</span>
              </h2>

              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <div className="achievement" key={achievement.title}>
                    <span className={`achievement-art achievement-art-${index + 1}`} aria-hidden="true" />
                    <span className="achievement-copy">
                      <strong>{achievement.title.replace(/^\S+\s/, "")}</strong>
                      <em>{achievement.detail}</em>
                    </span>
                    <span className="achievement-icon">{index === 0 ? "new" : "unlock"}</span>
                  </div>
                ))}
              </div>

              <p className="analysis-complete">✔️ Система не нашла ни одного похожего экземпляра. Это хорошо... наверное.</p>
            </article>
          )}
        </section>
      )}

      {customizerOpen && (phase === "lab" || phase === "analysis") && (
        <CharacterCustomizerModal
          customization={characterCustomization}
          onChange={updateCustomization}
          onClose={() => setCustomizerOpen(false)}
        />
      )}

      {activePhoto && (phase === "lab" || phase === "analysis") && (
        <div className="photo-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Фото ${activePhoto.label}`} onClick={() => setOpenPhotoId(null)}>
          <article className="photo-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="photo-modal-close" type="button" onClick={() => setOpenPhotoId(null)} aria-label="Закрыть фото">
              X
            </button>
            <div className="photo-modal-frame">
              {"src" in activePhoto && typeof activePhoto.src === "string" ? (
                <img src={activePhoto.src} alt={activePhoto.label} />
              ) : (
                <div className="photo-modal-placeholder">
                  <span>{activePhoto.label}</span>
                  <strong>{birthdayConfig.celebrantName}</strong>
                </div>
              )}
            </div>
            <footer className="photo-modal-caption">
              <strong>{activePhoto.label}</strong>
              <span>Memory file opened</span>
            </footer>
          </article>
        </div>
      )}

      {phase === "final" && (
        <section className={`final-scene ${finalClosed ? "is-closed" : ""}`} aria-label="Финальное поздравление">
          <div className="final-portal-mouth" aria-hidden="true">
            <span className="portal-asset final-portal-asset" />
            <span />
            <span />
            <span />
          </div>

          {!finalClosed && (
            <>
              <article className="final-card">
                <h1>Результаты анализа</h1>
                {finalDialog.map((line, index) => (
                  <section className={`final-dialog-line final-dialog-${line.speaker === "Рик" ? "rick" : "morty"}`} key={`${line.speaker}-${index}`}>
                    <strong className="final-dialog-speaker">
                      <span aria-hidden="true">{line.speaker === "Рик" ? "🧪" : "🟢"}</span>
                      {line.speaker}
                    </strong>
                    {line.intro && <em className="final-dialog-aside">{line.intro}</em>}
                    {line.body && (
                      <p className="final-dialog-body">
                        {line.body.map((segment, segmentIndex) =>
                          segment.strong ? (
                            <strong key={`${segment.text}-${segmentIndex}`}>{segment.text}</strong>
                          ) : (
                            <span key={`${segment.text}-${segmentIndex}`}>{segment.text}</span>
                          )
                        )}
                      </p>
                    )}
                    {line.aside && <em className="final-dialog-aside">{line.aside}</em>}
                    {line.heading && <h2>{line.heading}</h2>}
                    {line.items && (
                      <ul className="final-dialog-list">
                        {line.items.map((item) => (
                          <li key={`${item.icon}-${item.label}`}>
                            <span aria-hidden="true">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.value && <strong> — {item.value}</strong>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {line.announcement && <strong className="final-dialog-announcement">{line.announcement}</strong>}
                  </section>
                ))}
              </article>
            </>
          )}

          {finalClosed && (
            <>
              <article className="final-epilogue">
                <p className="final-epilogue-status">
                  <span aria-hidden="true">◎</span>
                  Портал закрыт. Реальность сохранена.
                </p>
                <h1>
                  <span className="final-epilogue-title-lead">{birthdayConfig.finalHeadlineLead}</span>
                  <strong className="final-epilogue-title-main">{birthdayConfig.finalHeadline}</strong>
                </h1>
                <span className="final-epilogue-greeting">{birthdayConfig.finalGreeting}</span>
                <p className="final-season-status">
                  <span aria-hidden="true">↗</span>
                  Новый сезон загружен
                </p>
              </article>
              <aside className="final-stinger" aria-label="Финальная реплика">
                <p>Ой ЙоЙ вот так завязочка, Ждем 31 сезон оЙ ЙоЙ</p>
                <img src="/assets/finale/final-character.png" alt="" />
              </aside>
            </>
          )}
        </section>
      )}
    </main>
  );
}

type CharacterCustomizerModalProps = {
  customization: CharacterCustomization;
  onChange: <Key extends keyof CharacterCustomization>(key: Key, value: CharacterCustomization[Key]) => void;
  onClose: () => void;
};

function CharacterCustomizerModal({ customization, onChange, onClose }: CharacterCustomizerModalProps) {
  return (
    <div className="customizer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Character customizer" onClick={onClose}>
      <article className="customizer-card" onClick={(event) => event.stopPropagation()}>
        <button className="customizer-close" type="button" onClick={onClose} aria-label="Close character customizer">
          X
        </button>

        <header className="customizer-header">
          <p>Mirror editor</p>
          <h2>Character setup</h2>
        </header>

        <div className="customizer-layout">
          <div className="customizer-options">
            <section className="customizer-section" aria-label="Clothes">
              <h3>Clothes</h3>
              <CustomizerSwatches
                label="T-shirt"
                value={customization.shirtColor}
                options={customizationOptions.shirtColors}
                onSelect={(value) => onChange("shirtColor", value)}
              />
              <CustomizerSwatches
                label="Shorts"
                value={customization.shortsColor}
                options={customizationOptions.shortsColors}
                onSelect={(value) => onChange("shortsColor", value)}
              />
            </section>

            <section className="customizer-section" aria-label="Face">
              <h3>Face</h3>
              <CustomizerSegments
                label="Eyes"
                value={customization.eyeStyle}
                options={customizationOptions.eyes}
                onSelect={(value) => onChange("eyeStyle", value)}
              />
              <CustomizerSegments
                label="Brows"
                value={customization.browStyle}
                options={customizationOptions.brows}
                onSelect={(value) => onChange("browStyle", value)}
              />
            </section>

            <section className="customizer-section" aria-label="Hair">
              <h3>Hair</h3>
              <CustomizerSegments
                label="Style"
                value={customization.hairStyle}
                options={customizationOptions.hair}
                onSelect={(value) => onChange("hairStyle", value)}
              />
              {customization.hairStyle === "cap" && (
                <CustomizerSwatches
                  label="Cap color"
                  value={customization.capColor}
                  options={customizationOptions.capColors}
                  onSelect={(value) => onChange("capColor", value)}
                />
              )}
            </section>
          </div>

          <aside className="customizer-preview-panel" aria-label="Live character preview">
            <div className="customizer-preview-label">
              <span>Live preview</span>
              <strong>Instant sync</strong>
            </div>
            <CharacterPreviewCanvas customization={customization} />
          </aside>
        </div>
      </article>
    </div>
  );
}

type SwatchOption = {
  label: string;
  value: string;
};

function CustomizerSwatches({
  label,
  value,
  options,
  onSelect
}: {
  label: string;
  value: string;
  options: SwatchOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="customizer-control">
      <span>{label}</span>
      <div className="customizer-swatches">
        {options.map((option) => (
          <button
            key={option.value}
            className="customizer-swatch"
            type="button"
            style={{ "--swatch-color": option.value } as CSSProperties}
            data-active={value === option.value}
            onClick={() => onSelect(option.value)}
            aria-label={option.label}
            aria-pressed={value === option.value}
          />
        ))}
      </div>
    </div>
  );
}

function CustomizerSegments<Value extends string>({
  label,
  value,
  options,
  onSelect
}: {
  label: string;
  value: Value;
  options: Array<{ label: string; value: Value }>;
  onSelect: (value: Value) => void;
}) {
  return (
    <div className="customizer-control">
      <span>{label}</span>
      <div className="customizer-segments">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={value === option.value}
            onClick={() => onSelect(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
