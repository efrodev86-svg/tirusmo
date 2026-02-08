import React, { useState } from 'react';

interface PrivacyPolicyProps {
    onViewTerms?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onViewTerms }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="w-full flex-1 bg-white dark:bg-[#101822]">
      <div className="max-w-[1000px] mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#111827] dark:text-white mb-8 text-center">AVISO DE PRIVACIDAD</h1>
        
        <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
          <p>
            En cumplimiento con los artículos 15, 16 y demás relativos a la Ley Federal de Protección de Datos Personales en Posesión de Particulares J & J OPERADORA MAYORISTA DE HOTELES, pone a su disposición el aviso de privacidad de conformidad con los siguientes puntos:
          </p>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">I. La identidad y domicilio del responsable que recaba datos personales:</h2>
            <p>
              J & J OPERADORA MAYORISTA DE HOTELES es una empresa constituida de conformidad con la legislación mexicana quien es la responsable de dar tratamiento, recabar, proteger y preservar los datos personales, incluyendo aquellos denominados sensibles, patrimoniales y financieros. Cuyo objetivo principal es ser una empresa operadora mayorista de hoteles y servicios.
            </p>
            <p className="mt-2">
              Que señala como domicilio para oír y recibir todo tipo de notificaciones la finca marcada con el número exterior 130, número exterior, Calle Marques de Barceló, Col. Lomas del marques, Santiago de Querétaro, Querétaro, C.P. 76146, con número telefónico 442 2455496.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">II. Forma de obtención de datos personales:</h2>
            <p>Podemos obtener información a través de los siguientes medios:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cuando nos la proporciona directamente por escrito;</li>
              <li>En forma verbal;</li>
              <li>Presente su solicitud de empleo o documento curricular;</li>
              <li>Por medio de entrevista;</li>
              <li>Formularios en internet o electrónicos;</li>
              <li>Servicios telefónicos;</li>
              <li>Cualquier otra forma permitida por la ley.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">III. Los datos que recabamos:</h2>
            <p>Los datos personales que obtenemos para cumplir con las finalidades establecidas en el presente aviso son:</p>
            
            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">A. Datos personales que recabamos de los titulares:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre Completo;</li>
                <li>Denominación o razón social;</li>
                <li>Nacionalidad;</li>
                <li>CURP;</li>
                <li>Registro Federal de Contribuyentes (RFC);</li>
                <li>Edad;</li>
                <li>Sexo;</li>
                <li>Fecha de nacimiento;</li>
                <li>Lugar de nacimiento;</li>
                <li>Domicilio particular;</li>
                <li>Número de teléfono particular;</li>
                <li>Número de celular;</li>
                <li>Correo electrónico;</li>
                <li>Firma autógrafa;</li>
                <li>Fotografía;</li>
                <li>Huella dactilar.</li>
              </ul>
            </div>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">B. Datos Personales que recabaremos para las personas que quieran emplearse o que han sido contratados:</h3>
              <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Los establecidos en el punto “A” anterior inmediato;</li>
                <li>Escolaridad;</li>
                <li>Empleos presentes y anteriores;</li>
                <li>Número de seguridad social;</li>
                <li>Estado civil;</li>
                <li>Número de Afore.</li>
              </ul>
              <p className="mt-2 text-sm italic">De conformidad con la legislación en la materia consideraremos que nos ha otorgado su consentimiento de manera tácita respecto a sus datos personales anteriormente mencionados. Le hacemos de su conocimiento que podrá oponerse en cualquier momento mediante el procedimiento establecido en el punto número VI, denominado Los Medios para ejercer ARCO, de este aviso de privacidad para oponerse a su tratamiento.</p>
            </div>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">C. Los Datos Personales Sensibles:</h3>
              <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Religión;</li>
                <li>Estado de salud;</li>
                <li>Hábitos personales;</li>
                <li>Tipo de sangre;</li>
                <li>Pertenencia a un sindicato.</li>
              </ul>
            </div>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">D. Patrimoniales o Financieros:</h3>
              <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Número de tarjeta de crédito;</li>
                <li>Cuentas bancarias;</li>
                <li>Estados de cuenta;</li>
                <li>Recibos de nómina,</li>
                <li>En caso de tener crédito hipotecario.</li>
              </ul>
              <p className="mt-2 text-sm italic">En el caso de los Datos Sensibles, Financieros o Patrimoniales es obligatorio que, de conformidad con la legislación en la materia, nos otorgue su consentimiento expreso para darles tratamiento. Por lo que le solicitamos nos firme los formatos que pondremos a su disposición.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">IV. Las finalidades del tratamiento de datos:</h2>
            <p>Los datos personales del titular serán utilizados por J & J OPERADORA MAYORISTA DE HOTELES para las siguientes finalidades, en su carácter de entidad responsable de la protección de sus datos personales:</p>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">A. Finalidades principales:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Proveer los servicios contratados;</li>
                <li>Medio para dar cumplimiento a obligaciones contraídas;</li>
                <li>Para enviarle facturas;</li>
                <li>Dar seguimiento al proceso de cobranza;</li>
                <li>Cualquier otra finalidad compatible o análoga a los fines previamente establecidos.</li>
              </ul>
            </div>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">B. Finalidad dirigida a los Empleados:</h3>
              <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Para el proceso de evaluación, reclutamiento y selección de personal;</li>
                <li>Para la administración de su expediente laboral;</li>
                <li>Integración de los documentos necesarios para el desempeño de sus servicios;</li>
                <li>Pago de nómina y demás prestaciones laborales;</li>
                <li>Cualquier otra finalidad compatible o análoga a los fines previamente establecidos.</li>
              </ul>
            </div>

            <div className="mt-4 pl-4">
              <h3 className="font-bold text-[#111827] dark:text-white mb-2">C. Finalidades Secundarias:</h3>
              <p className="mb-2">De manera adicional, utilizaremos su información personal para las siguientes finalidades secundarias, que no son necesarias para el servicio solicitado, pero que nos permiten y facilitan brindarle una mejor atención:</p>
              <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Circulares informativas;</li>
                <li>Evaluaciones de calidad de los servicios o productos que contrató;</li>
                <li>Para enviarle información comercial, servicios o promociones;</li>
                <li>Para invitarlo a eventos a realizar;</li>
              </ul>
              <p className="mt-2 text-sm italic">
                En caso de que no desee que sus datos personales sean tratados para estos fines secundarios, usted puede presentar desde este momento un escrito a J & J OPERADORA MAYORISTA DE HOTELES. La negativa para el uso de sus datos personales para estas finalidades, no podrá ser un motivo para que le neguemos los servicios que solicita o contrata con nosotros.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">V. Las opciones y medios que ofrecemos a los titulares para limitar el uso o divulgación de los datos:</h2>
            <p>
              J & J OPERADORA MAYORISTA DE HOTELES, con la finalidad de resguardar de la mejor manera posible su información se compromete a tratar sus datos personales bajo estrictas medidas de seguridad para garantizar su confidencialidad. Se han establecido estándares de seguridad en las materias administrativa, legal y se han aplicado medidas tecnológicas para evitar que terceros no autorizados se apoderen de sus datos personales.
            </p>
            <p className="mt-2">
              Cabe mencionar que el titular de los datos personales puede iniciar un procedimiento de Acceso, Rectificación, Cancelación u Oposición (Por sus siglas ARCO) para limitar el uso o divulgar sus datos de conformidad con el capítulo VI del presente aviso de privacidad.
            </p>
            <p className="mt-2">
              Además, existen procedimientos administrativos mediante los cuales puede limitar la publicidad por llamadas de teléfono denominado Registro Público para Evitar Publicidad que proporciona la Procuraduría Federal del Consumidor, que puede consultar en la página de internet: <a href="http://rpc.profeco.gob.mx/Solicitudnumero.jsp" className="text-primary hover:underline">http://rpc.profeco.gob.mx/Solicitudnumero.jsp</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">VI. Los medios para ejercer los derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO) de los datos personales.</h2>
            <p>
              Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento de sus datos personales. Sin embargo, es importante que tenga en cuenta que no en todos los casos podremos atender su solicitud o concluir el uso de forma inmediata, ya que es posible que por alguna obligación legal requiramos seguir tratando sus datos personales. Asimismo, usted deberá considerar que para ciertos fines, la revocación de su consentimiento implicará que no le podamos seguir prestando el servicio que nos solicitó o la conclusión de su relación con nosotros.
            </p>
            <p className="mt-2 font-semibold">
              El titular podrá ejercer sus derechos de rectificación, acceso, cancelación u oposición al tratamiento de sus datos, por sus siglas ARCO, presentando una solicitud de conformidad con el siguiente procedimiento:
            </p>
            <p className="mt-2">
              Realizar su solicitud enviando un correo electrónico a la siguiente dirección: <a href="mailto:jjoperadora@hotmail.com" className="text-primary hover:underline">jjoperadora@hotmail.com</a>, dirigido a Jorge Juárez Pineda, en su calidad de responsable de atender sus solicitudes. Así mismo el titular de los datos tendrá que llevar su solicitud personalmente con su identificación oficial al domicilio antes mencionado. Los datos y documentación que debe anexar a su solicitud son:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>El nombre del titular de los datos personales, su domicilio y un medio alterno para comunicarle la respuesta a su solicitud;</li>
              <li>Los documentos que acrediten la identidad del titular de los datos personales o, en su caso, si lo hace un tercero acreditar la representación legal;</li>
              <li>La descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos de ARCO; y</li>
              <li>Cualquier otro elemento o documento que facilite la localización de sus Datos Personales; y</li>
              <li>En su caso, las solicitudes de rectificación de datos personales, el titular deberá indicar las modificaciones a realizarse y aportar la documentación que sustente su petición.</li>
            </ul>
            <p className="mt-2">
              En caso de que se aprecie que la documentación tenga tachaduras, este alterada o se tenga duda razonable de ser apócrifa, que no sea el titular, o no ser el legítimo representante, J & J OPERADORA MAYORISTA DE HOTELES, se reserva el derecho a solicitar cualquier otro documento para comprobar y acreditar la titularidad de los datos, por lo que se le podrá solicitar que presente la documentación en original o copias certificadas en la oficina del responsable.
            </p>
            <p className="mt-2">
              Si faltara alguna información en su solicitud se le solicitará subsane la omisión a la brevedad.
            </p>
            <p className="mt-2">
              Si cumpliera con todas las formalidades requeridas para dicho trámite se dará respuesta en un plazo máximo de veinte días, contados a partir de la fecha en que se recibió su petición o a partir de la fecha en que haya subsanado en su totalidad las prevenciones. El plazo antes referido podrá ser ampliado una sola vez por un periodo igual, siempre y cuando así lo justifiquen las circunstancias del caso. De conformidad con el artículo 32 de la ley de la materia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">VII. En su caso, las transferencias de datos que se efectúen.</h2>
            <p>
              Le hacemos de su conocimiento que J & J OPERADORA MAYORISTA DE HOTELES, no realiza transferencias de información a terceros sin su previa autorización.
            </p>
            <p className="mt-2">
              Solo se podrán hacer transferencias sin su consentimiento de acuerdo a lo previsto en el artículo 37 de la Ley Federal de Protección de datos Personales en Posesión de los Particulares, así como a realizar esta transferencia en los términos que fija esa ley, a lo que establecemos lo supuesto:
            </p>
            <ul className="list-[lower-alpha] pl-6 mt-2 space-y-1">
              <li>Cuando la transferencia esté prevista en una Ley;</li>
              <li>Cuando la transferencia sea necesaria para la prevención o el diagnóstico médico, la prestación de asistencia sanitaria, tratamiento médico o la gestión de servicios sanitarios;</li>
              <li>Cuando la transferencia sea efectuada a sociedades controladoras, subsidiarias o afiliadas bajo el control común del responsable, o a una sociedad matriz o a cualquier sociedad del mismo Grupo del responsable que opere bajo los mismos procesos y políticas internas;</li>
              <li>Cuando la transferencia sea necesaria por virtud de un contrato celebrado o por celebrar en interés del titular, por el responsable y un tercero;</li>
              <li>Cuando la transferencia sea necesaria o legalmente exigida para la salvaguarda de un interés público, o para la procuración o administración de justicia;</li>
              <li>Cuando la transferencia sea precisa para el reconocimiento, ejercicio o defensa de un derecho en un proceso judicial; y</li>
              <li>Cuando la transferencia sea precisa para el mantenimiento o cumplimiento de una relación jurídica entre el responsable y el titular.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-4">VIII. El medio y procedimiento mediante el cual el responsable comunicará a los titulares de cambios al aviso de privacidad, de conformidad con lo previsto en la Ley de la materia.</h2>
            <p>
              J & J OPERADORA MAYORISTA DE HOTELES se reserva el derecho de efectuar, en cualquier momento, modificaciones y adición en todo o en parte del presente aviso de privacidad.
            </p>
            <p className="mt-2">
              Toda modificación se notificará mediante un aviso al mail: <a href="mailto:jjoperadora@hotmail.com" className="text-primary hover:underline">jjoperadora@hotmail.com</a>, propiedad de la empresa.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-[#1a2634] p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 shadow-sm transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium select-none">
                        He leído y acepto los términos y condiciones
                    </span>
                </label>
                <button 
                    onClick={() => onViewTerms && onViewTerms()}
                    className="text-primary font-bold hover:underline flex items-center gap-1 text-sm bg-transparent border-none p-0 cursor-pointer"
                >
                    Ver términos
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};