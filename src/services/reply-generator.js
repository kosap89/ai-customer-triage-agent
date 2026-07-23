import { CATEGORIES } from '../config/categories.js';
import { buildAppointmentBookingReply } from '../lib/appointment-details.js';

/**
 * Finnish reply draft templates (v1 — rule-based).
 * Swap this module for LLM-generated replies while keeping generateReply() signature.
 *
 * @param {object} params
 * @param {object} params.message - Normalized customer message
 * @param {string} params.category
 * @param {string} params.urgency
 * @returns {{ language: string, draft: string, tone: string }}
 */
export function generateReply({ message, category, urgency }) {
  const name = message.customerName.split(' ')[0] || 'asiakas';
  const fullText = [message.subject, message.body].filter(Boolean).join('\n');

  if (category === CATEGORIES.APPOINTMENT_BOOKING) {
    return {
      language: 'fi',
      draft: buildAppointmentBookingReply({
        customerName: message.customerName,
        fullText,
      }),
      tone: 'friendly',
      urgencyContext: urgency,
    };
  }

  const templates = {
    [CATEGORIES.PRICING_QUESTION]: {
      tone: 'helpful',
      draft: `Hei ${name},

Kiitos hintatiedustelustasi!

Lähetän sinulle tarkemmat hinnat ja mahdolliset alennukset. Kerrothan lyhyesti, mitä palvelua tai tuotetta olet kiinnostunut — näin voimme antaa sinulle oikean tarjouksen.

Ystävällisin terveisin,
Asiakaspalvelu`,
    },
    [CATEGORIES.COMPLAINT]: {
      tone: 'empathetic',
      draft: `Hei ${name},

Olen pahoillani kuullakseni, että kokemuksesi ei vastannut odotuksiasi. Kiitos, että otit meihin yhteyttä.

Haluan selvittää asian huolellisesti. Voisitko kertoa tarkemmin, milloin käyntisi tapahtui ja mitä konkreettisesti meni pieleen? Palaan asiaan henkilökohtaisesti mahdollisimman pian.

Ystävällisin terveisin,
Asiakaspalvelu`,
    },
    [CATEGORIES.CANCELLATION]: {
      tone: 'professional',
      draft: `Hei ${name},

Kiitos viestistäsi peruutuksesta.

Käsittelen peruutuspyyntösi ja varmistan, ettei uusia veloituksia tule. Jos laskussa on ollut virhe, selvitän sen samalla. Vahvistan toimenpiteet sähköpostitse.

Ystävällisin terveisin,
Asiakaspalvelu`,
    },
    [CATEGORIES.URGENT_ISSUE]: {
      tone: 'urgent_care',
      draft: `Hei ${name},

Kiitos, että ilmoitit asiasta heti — otamme tämän käsittelyyn kiireellisenä.

Selvitän tilanteen nyt ja palaan sinulle mahdollisimman pian, viimeistään seuraavan tunnin aikana. Jos kyseessä on maksuongelma, älä tee uusia maksuja ennen kuin olemme yhteydessä.

Ystävällisin terveisin,
Asiakaspalvelu`,
    },
    [CATEGORIES.GENERAL_QUESTION]: {
      tone: 'informative',
      draft: `Hei ${name},

Kiitos viestistäsi!

Vastaan kysymykseesi mielellämme. Jos tarvitset lisätietoja, kerrothan — autamme mielellämme.

Ystävällisin terveisin,
Asiakaspalvelu`,
    },
  };

  const selected = templates[category] ?? templates[CATEGORIES.GENERAL_QUESTION];

  return {
    language: 'fi',
    draft: selected.draft,
    tone: selected.tone,
    urgencyContext: urgency,
  };
}
