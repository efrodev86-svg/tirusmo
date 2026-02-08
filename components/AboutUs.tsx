import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <div className="w-full flex-1">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop" 
          alt="Vacaciones en familia en la playa" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">Sobre Nosotros</h1>
          <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto">
            Redefiniendo la forma de viajar: más humana, más accesible y más consciente.
          </p>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-[1000px] mx-auto px-6 py-16 flex flex-col gap-16">
        
        {/* Quiénes somos */}
        <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6 text-gray-600 leading-relaxed text-lg">
                <h2 className="text-3xl font-bold text-[#111827] mb-2">Quiénes somos</h2>
                <p>
                    Somos una agencia de viajes especializada en crear vacaciones increíbles a precios accesibles, diseñada para personas que buscan algo más que solo trasladarse de un lugar a otro. Creemos que viajar debe ser una experiencia completa: organizada, consciente, sin estrés y profundamente disfrutable.
                </p>
                <p>
                    Nacimos con la convicción de que las mejores experiencias de viaje no tienen que ser las más caras, sino las mejor planeadas. Por eso, combinamos precios competitivos con un acompañamiento integral y holístico, cuidando cada detalle para que nuestros viajeros se enfoquen únicamente en disfrutar.
                </p>
                <p>
                    En nuestra agencia, cada viaje es diseñado de forma personalizada, considerando no solo el destino, sino también el bienestar, las expectativas y el ritmo de cada persona. Acompañamos a nuestros clientes antes, durante y después del viaje, ofreciendo orientación, apoyo y atención constante para garantizar vacaciones seguras, memorables y sin preocupaciones.
                </p>
                <p>
                    Nos especializamos en vacaciones accesibles, experiencias auténticas y viajes con sentido, integrando recomendaciones y acompañamientos que promueven el descanso, la conexión personal y el disfrute consciente. Más que vender paquetes turísticos, creamos experiencias que dejan huella.
                </p>
                <p className="font-semibold text-primary">
                    Hoy, somos una agencia de viajes comprometida con redefinir la forma de viajar: más humana, más accesible y más consciente, demostrando que unas vacaciones increíbles están al alcance de todos.
                </p>
            </div>
            <div className="w-full md:w-[400px] shrink-0">
                <img 
                    src="https://images.unsplash.com/photo-1552083375-1447ce886485?q=80&w=800&auto=format&fit=crop" 
                    alt="Viaje familiar con maletas llegando al hotel" 
                    className="w-full h-[500px] object-cover rounded-2xl shadow-xl"
                />
            </div>
        </div>

        {/* Misión & Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#EFF6FF] p-10 rounded-2xl border border-blue-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-4xl filled">flag</span>
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-4">Misión</h3>
                <p className="text-gray-600 leading-relaxed">
                    Ofrecer experiencias de viaje únicas y vacaciones inolvidables a través de una agencia de viajes especializada en precios accesibles y acompañamiento integral. Diseñamos cada viaje con un enfoque holístico que garantiza bienestar, tranquilidad y una experiencia vacacional completa antes, durante y después del viaje.
                </p>
            </div>

            <div className="bg-[#F0FDF4] p-10 rounded-2xl border border-green-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-green-600 mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-4xl filled">visibility</span>
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-4">Visión</h3>
                <p className="text-gray-600 leading-relaxed">
                    Ser una agencia de viajes líder en la creación de vacaciones accesibles y experiencias de viaje transformadoras, reconocida por combinar precios competitivos, atención personalizada y un enfoque integral de bienestar que eleva la forma en que las personas disfrutan sus viajes.
                </p>
            </div>
        </div>

        {/* Valores */}
        <div>
            <h2 className="text-3xl font-bold text-[#111827] text-center mb-12">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Valor 1 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">savings</span>
                    <h4 className="font-bold text-lg text-[#111827]">Vacaciones accesibles y de calidad</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Creemos que viajar bien debe estar al alcance de todos. Ofrecemos paquetes con precios más bajos que la competencia, sin comprometer la calidad.
                    </p>
                </div>

                {/* Valor 2 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">support_agent</span>
                    <h4 className="font-bold text-lg text-[#111827]">Acompañamiento integral</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Brindamos atención personalizada y acompañamiento continuo para que cada experiencia sea segura, organizada y libre de preocupaciones.
                    </p>
                </div>

                {/* Valor 3 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">self_improvement</span>
                    <h4 className="font-bold text-lg text-[#111827]">Bienestar y experiencia holística</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Integramos prácticas enfocadas en el bienestar físico, mental y emocional, haciendo de cada viaje una experiencia equilibrada.
                    </p>
                </div>

                {/* Valor 4 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">handshake</span>
                    <h4 className="font-bold text-lg text-[#111827]">Confianza y transparencia</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Comprometidos con la claridad, la honestidad y la comunicación constante, generando relaciones duraderas con nuestros viajeros.
                    </p>
                </div>

                {/* Valor 5 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">explore</span>
                    <h4 className="font-bold text-lg text-[#111827]">Experiencias auténticas</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Diseñamos vacaciones que conectan a las personas con los destinos, promoviendo vivencias reales, significativas y memorables.
                    </p>
                </div>

                {/* Valor 6 */}
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">person_pin</span>
                    <h4 className="font-bold text-lg text-[#111827]">Enfoque en el viajero</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Cada viaje comienza escuchando a nuestros clientes. Adaptamos nuestras soluciones a sus necesidades y objetivos.
                    </p>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};