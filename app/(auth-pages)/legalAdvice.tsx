import Link from 'next/link';
import React from 'react'

const LegalAdvice = () => {
  return (
    <div className="flex items-center gap-2">
            
            <label htmlFor="terms" className=" rounded-lg p-2 my-2">
            <h6 className='text-sm'>Al continuar usando nuestra plataforma, usted entiende y acepta:</h6>
              <ul className="list-disc list-inside">
                <li>
                  <Link
                    href={`/terms`}
                    className="text-muted-foreground text-xs underline"
                  >
                    Terminos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/privacy`}
                    className="text-muted-foreground text-xs underline"
                  >
                    Politicas de Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/cookies`}
                    className="text-muted-foreground text-xs underline"
                  >
                    Politicas de Cookies
                  </Link>
                </li>
              </ul>
            </label>
          </div>
  )
}

export default LegalAdvice;
