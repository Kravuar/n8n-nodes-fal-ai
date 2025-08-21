import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FalAiCredentials implements ICredentialType {
	name = 'falAiCredentials';
	displayName = 'Fal AI API Key';
	documentationUrl = 'https://docs.fal.ai/clients/javascript';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
                password: true,
            },
			default: '',
			placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
			required: true,
			noDataExpression: false,
		},
	];
} 