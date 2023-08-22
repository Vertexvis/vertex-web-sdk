// These steps should be updated with the scene item IDs for each step in the
// work instruction.

const step1 = {
  operationSets: [
    {
      operations: [
        {
          type: 'hide',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: ['73b19c01-ebab-4e4c-afad-80d5fce7c1f1'],
      },
    },
  ],
};

const step2 = {
  operationSets: [
    {
      operations: [
        {
          type: 'show',
        },
        {
          type: 'hide',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
        ],
      },
    },
  ],
};

const step3 = {
  operationSets: [
    {
      operations: [
        {
          type: 'show',
        },
        {
          type: 'clearOverrides',
        },
        {
          type: 'hide',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
        ],
      },
    },
  ],
};

const step4 = {
  operationSets: [
    {
      operations: [
        {
          type: 'hide',
        },
        {
          type: 'clearOverrides',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
          '5fef7133-f8e7-490d-821e-604288f75377',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '5fef7133-f8e7-490d-821e-604288f75377',
        ],
      },
    },
  ],
};

const step5 = {
  operationSets: [
    {
      operations: [
        {
          type: 'hide',
        },
        {
          type: 'clearOverrides',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
          '5fef7133-f8e7-490d-821e-604288f75377',
          'c5bc911d-24e6-4fe4-bade-084d4c822d64',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          'c5bc911d-24e6-4fe4-bade-084d4c822d64',
        ],
      },
    },
  ],
};

const step6 = {
  operationSets: [
    {
      operations: [
        {
          type: 'hide',
        },
        {
          type: 'clearOverrides',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
          '5fef7133-f8e7-490d-821e-604288f75377',
          'c5bc911d-24e6-4fe4-bade-084d4c822d64',
          'b91b709b-9ed4-4db5-9491-d2f72501c701',
          'f506b883-f01f-45da-92a9-1b0e517d833d',
          'ed8041b5-b398-4772-ad44-92fde2d7fa44',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          'b91b709b-9ed4-4db5-9491-d2f72501c701',
          'f506b883-f01f-45da-92a9-1b0e517d833d',
          'ed8041b5-b398-4772-ad44-92fde2d7fa44',
        ],
      },
    },
  ],
};

const step7 = {
  operationSets: [
    {
      operations: [
        {
          type: 'hide',
        },
        {
          type: 'clearOverrides',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
    {
      operations: [
        {
          type: 'show',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '73b19c01-ebab-4e4c-afad-80d5fce7c1f1',
          'e36ee1ff-3c6f-492c-b55b-634bd8ba045c',
          '641770ce-8452-4fa7-8057-cd4e9828fb8f',
          '9a77532f-bdef-4944-a213-d8992db51eb6',
          '662d569f-b9bc-47e7-8f78-99a116c213da',
          '69ba9c9f-79dc-4851-a499-98b5d4e7bd4e',
          '5fef7133-f8e7-490d-821e-604288f75377',
          'c5bc911d-24e6-4fe4-bade-084d4c822d64',
          'b91b709b-9ed4-4db5-9491-d2f72501c701',
          'f506b883-f01f-45da-92a9-1b0e517d833d',
          'ed8041b5-b398-4772-ad44-92fde2d7fa44',
          '4ea1f850-2c97-43ce-bcc0-38f67b5916a7',
          'b92fe17d-bfe3-47a6-a58f-9c064f17dfda',
          'a71e5a5b-1d9f-4743-a8dd-de8a068bb4ad',
        ],
      },
    },
    {
      operations: [
        {
          type: 'materialOverride',
          value: '#ff0000',
        },
      ],
      query: {
        type: 'itemId',
        values: [
          '4ea1f850-2c97-43ce-bcc0-38f67b5916a7',
          'b92fe17d-bfe3-47a6-a58f-9c064f17dfda',
          'a71e5a5b-1d9f-4743-a8dd-de8a068bb4ad',
        ],
      },
    },
  ],
};

const step8 = {
  operationSets: [
    {
      operations: [
        {
          type: 'show',
        },
        {
          type: 'clearOverrides',
        },
      ],
      query: {
        type: 'all',
        values: [],
      },
    },
  ],
};

export default [step1, step2, step3, step4, step5, step6, step7, step8];
