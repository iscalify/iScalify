# Iscalify lead analytics — event integration

## Current status
The website repository contains no GA4 measurement ID or GTM installation. GA4 is not connected to the Windsor.ai reporting plugin. This change instruments event handlers but does not install third-party scripts, set cookies, transmit event data, or activate analytics.

Before collecting GA4 data, obtain the real GA4 web stream Measurement ID and use a suitable consent management setup. Do not invent a Measurement ID. Follow consent and privacy requirements, particularly for the EEA/UK.

## Events

| Event | Condition | Lead classification |
| --- | --- | --- |
| generate_lead | FormSubmit AJAX request succeeds and the success message is shown | Confirmed form lead — preferred key event |
| contact_phone_click | User activates a tel link | Intent only, not a call |
| contact_email_click | User activates a mailto link | Intent only, not a sent email |
| contact_whatsapp_click | User opens a WhatsApp link | Intent only, not a sent message |
| appointment_link_click | User opens Calendly | Intent only, not a completed booking |

No personal or business information is sent in event properties. Only static method/source names and the site's path are provided. The native FormSubmit fallback cannot confirm a completed submission, so it does not trigger generate_lead.

## Enabling and validating
1. Configure the Google tag with the real GA4 web stream Measurement ID and privacy/consent controls. Install it exactly once.
2. If window.gtag exists, the site sends standard event calls. If GTM is present without gtag, it pushes the events prefixed iscalify_ to the existing dataLayer; create GTM Custom Event triggers and GA4 Event tags mapping to the names above, respecting consent.
3. Mark generate_lead as the GA4 key event, not every click event. Avoid counting automatically detected form_submit and generate_lead as two leads.
4. Test using GA4 DebugView and one genuine test form. Confirm no event appears for a failed submission, and no PII appears in any event.
5. Use your CMP to respect visitor consent before installing/activating tags, especially for EEA and UK audiences.

References:
https://developers.google.com/analytics/devguides/collection/ga4/reference/events
https://developers.google.com/tag-platform/security/guides/consent
