# Iscalify GA4 and lead conversion tracking

## Installation status
- Google tag identifier provided by Iscalify: **G-W53H59HNGS**
- Google tag source: `https://www.googletagmanager.com/gtm.js?id=G-W53H59HNGS`, using Google's current Google tag loader format for a G- identifier (not a GTM- container)
- Consent mode: **basic opt-in** — the Google tag is not requested and no GA4 events are queued until analytics consent is granted
- Analytics preference is stored locally under `iscalify_analytics_consent_v1`
- Visitors can accept, decline or change their choice with a footer button; declining after previously accepting revokes consent and reloads to stop the tag
- Consent Mode v2 `analytics_storage` is enabled after acceptance; ad_storage, ad_user_data and ad_personalization remain denied
- No form contents or contact details are included in events

## Events
| GA4 event | Trigger | Meaning |
| --- | --- | --- |
| generate_lead | FormSubmit's AJAX request returns success | Successful contact-form submission |
| contact_phone_click | User clicks a tel link | Interest only, not a completed call |
| contact_email_click | User clicks a mailto link | Interest only, not a sent email |
| contact_whatsapp_click | User clicks a WhatsApp link | Interest only, not a sent message |
| appointment_link_click | User clicks a Calendly link | Interest only, not a completed booking |

Event properties are limited to page_path, lead_source, contact_method, booking_platform.

The form's native fallback navigates away to FormSubmit if AJAX fails. Because this site cannot confirm completion in that fallback, it intentionally does not trigger generate_lead.

## Validation checklist
1. Visit a fresh browser session, without prior consent. Verify **no request** to googletagmanager.com/gtm.js or GA4 collect endpoints before accepting.
2. Click Decline. No analytics tag must load and no tracking events must be sent.
3. Reopen Analytics preferences in the footer, click Accept analytics and confirm the Google tag loads once and GA4 page_view appears.
4. In Google Analytics DebugView/Tag Assistant, verify exactly one event for each contact action and exactly one generate_lead for a successful form submission. Test that unsuccessful submissions do not generate a lead.
5. Click Decline after an accepted session, confirm GA4 stops loading on the new page and first-party _ga cookies are cleared.
6. In GA4 Admin, mark **generate_lead** as the key event if desired; do not count click events as verified leads.
7. Connect the GA4 property in Windsor.ai separately if reporting through ChatGPT is desired. A measurement ID does not grant GA4 account/report access.

## Important
This lightweight consent dialog is a basic technical opt-in, **not** a substitute for a legal privacy/cookie notice or a professionally reviewed consent-management platform. Review local and international requirements, especially for UK/EEA audiences, before relying on it for regulatory compliance.

Google reference: https://developers.google.com/tag-platform/security/concepts/consent-mode
Google tag installation: https://developers.google.com/tag-platform/gtagjs
