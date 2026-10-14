/*
 * Adaptive Form definition (crispr JSON, the format af-core reads).
 * Opted in to WebMCP with properties['fd:webMcpEnabled'], exactly like an authored AEM form.
 * Submissions POST (multipart, af-core default) to `action`, handled by the Cloudflare Worker.
 */
export const SUBMIT_ENDPOINT = '/api/webmcp-form/submit';

export default {
  id: 'montreal-visit-request',
  fieldType: 'form',
  title: 'Montréal Visit Request',
  description: 'Request a personalised Montréal itinerary. Test form: no trip is booked and nothing is charged.',
  action: SUBMIT_ENDPOINT,
  properties: { 'fd:webMcpEnabled': true },
  items: [
    {
      name: 'firstName', fieldType: 'text-input', type: 'string', required: true, label: { value: 'First name' },
    },
    {
      name: 'lastName', fieldType: 'text-input', type: 'string', required: true, label: { value: 'Last name' },
    },
    {
      name: 'email',
      fieldType: 'email',
      type: 'string',
      format: 'email',
      required: true,
      label: { value: 'Email' },
      description: 'We send the itinerary to this address.',
    },
    {
      name: 'arrivalDate',
      fieldType: 'date-input',
      type: 'string',
      format: 'date',
      required: true,
      label: { value: 'Arrival date' },
    },
    {
      name: 'nights',
      fieldType: 'number-input',
      type: 'integer',
      required: true,
      minimum: 1,
      maximum: 14,
      label: { value: 'Number of nights' },
    },
    {
      name: 'neighbourhood',
      fieldType: 'drop-down',
      type: 'string',
      required: true,
      enforceEnum: true,
      enum: ['plateau', 'old-montreal', 'mile-end', 'downtown'],
      enumNames: ['Le Plateau-Mont-Royal', 'Old Montréal', 'Mile End', 'Downtown'],
      label: { value: 'Neighbourhood to stay in' },
      description: 'Nightly estimate: Plateau $180, Old Montréal $240, Mile End $160, Downtown $220.',
    },
    {
      name: 'interests',
      fieldType: 'checkbox-group',
      type: 'string[]',
      enforceEnum: true,
      enum: ['food', 'museums', 'festivals', 'outdoors'],
      enumNames: ['Food & markets', 'Museums', 'Festivals', 'Parks & outdoors'],
      label: { value: 'Interests' },
    },
    {
      name: 'companions',
      fieldType: 'panel',
      type: 'array',
      repeatable: true,
      minOccur: 0,
      maxOccur: 5,
      label: { value: 'Travelling with' },
      description: 'One entry per additional traveller. Leave empty if travelling alone.',
      items: [
        {
          name: 'companionName', fieldType: 'text-input', type: 'string', label: { value: 'Full name' },
        },
        {
          name: 'companionAge',
          fieldType: 'number-input',
          type: 'integer',
          minimum: 0,
          maximum: 120,
          label: { value: 'Age' },
        },
      ],
    },
    {
      name: 'estimatedTotal',
      fieldType: 'number-input',
      type: 'number',
      readOnly: true,
      label: { value: 'Estimated accommodation total (CAD)' },
      description: 'Calculated from nights and neighbourhood.',
      rules: {
        value: "nights * if(neighbourhood == 'old-montreal', 240, if(neighbourhood == 'downtown', 220, if(neighbourhood == 'mile-end', 160, 180)))",
      },
    },
    {
      name: 'notes',
      fieldType: 'multiline-input',
      type: 'string',
      maxLength: 500,
      label: { value: 'Anything else?' },
    },
    {
      name: 'consent',
      fieldType: 'checkbox',
      type: 'boolean',
      enum: [true, false],
      required: true,
      label: { value: 'I understand this is a test form and no trip will be booked.' },
    },
  ],
};
