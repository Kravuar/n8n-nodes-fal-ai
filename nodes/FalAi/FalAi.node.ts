import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { fileTypeFromBuffer } from 'file-type';

export class FalAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fal AI',
		name: 'falAi',
		icon: 'file:falai.svg',
		group: ['integrations'],
		version: 1,
		description: 'Integrate with Fal AI models, queue, storage, and workflow.',
		defaults: {
			name: 'Fal AI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'falAiCredentials',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Model', value: 'model' },
					{ name: 'Queue', value: 'queue' },
					{ name: 'Storage', value: 'storage' },
					{ name: 'Workflow', value: 'workflow' },
				],
				default: 'model',
			},

			// MODEL RESOURCE
			{
				displayName: 'Operation',
				name: 'modelOperation',
				type: 'options',
				displayOptions: { show: { resource: ['model'] } },
				options: [
					{ name: 'Run (Sync)', value: 'runSync', description: 'Run model and wait for result' },
					{ name: 'Run (Async)', value: 'runAsync', description: 'Submit model job and get request_id' },
				],
				default: 'runSync',
			},
			{
				displayName: 'Model ID',
				name: 'modelId',
				type: 'string',
				displayOptions: { show: { resource: ['model'] } },
				default: '',
				required: true,
				placeholder: 'fal-ai/anything/anything',
				description: 'The ID of the model to run',
			},
			{
				displayName: 'Input Data Mode',
				name: 'inputDataMode',
				type: 'options',
				displayOptions: { show: { resource: ['model'] } },
				options: [
					{ name: 'Raw JSON', value: 'raw' },
					{ name: 'Key-Value Form', value: 'form' },
				],
				default: 'form',
			},
			{
				displayName: 'Input Data (JSON)',
				name: 'inputDataRaw',
				type: 'json',
				displayOptions: { show: { resource: ['model'], inputDataMode: ['raw'] } },
				default: '{}',
				description: 'Raw JSON input for the model',
				required: true,
			},
			{
				displayName: 'Input Data (Fields)',
				name: 'inputDataForm',
				type: 'fixedCollection',
				displayOptions: { show: { resource: ['model'], inputDataMode: ['form'] } },
				placeholder: 'Add Input',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'inputs',
						displayName: 'Inputs',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								required: true,
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},

			// QUEUE RESOURCE
			{
				displayName: 'Operation',
				name: 'queueOperation',
				type: 'options',
				displayOptions: { show: { resource: ['queue'] } },
				options: [
					{ name: 'Get Status', value: 'getStatus', description: 'Get status of async job' },
					{ name: 'Get Result', value: 'getResult', description: 'Get result of async job' },
				],
				default: 'getStatus',
			},
			{
				displayName: 'Model ID',
				name: 'modelId',
				type: 'string',
				displayOptions: { show: { resource: ['queue'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Request ID',
				name: 'requestId',
				type: 'string',
				displayOptions: { show: { resource: ['queue'] } },
				default: '',
				required: true,
			},

			// STORAGE RESOURCE
			{
				displayName: 'Operation',
				name: 'storageOperation',
				type: 'options',
				displayOptions: { show: { resource: ['storage'] } },
				options: [
					{ name: 'Upload File', value: 'upload', description: 'Upload file to Fal AI storage' },
				],
				default: 'upload',
			},
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				displayOptions: { 
					show: { resource: ['storage', 'workflow'], storageOperation: ['upload'], workflowOperation: ['modelWorkflow'], fileInput: [true] },
				},
				default: '',
				description: 'Name of binary property containing file to upload',
				required: true,
			},
			{
				displayName: 'MIME Type',
				name: 'mimeType',
				type: 'string',
				displayOptions: {
					show: { resource: ['storage', 'workflow'], storageOperation: ['upload'], workflowOperation: ['modelWorkflow'], fileInput: [true] },
				},
				default: '',
				description: 'MIME type (optional, auto-detect if empty)',
			},

			// WORKFLOW RESOURCE
			{
				displayName: 'Operation',
				name: 'workflowOperation',
				type: 'options',
				displayOptions: { show: { resource: ['workflow'] } },
				options: [
					{ name: 'Model Workflow', value: 'modelWorkflow', description: 'Upload file (if needed), run model async, poll status, get result, download file' },
				],
				default: 'modelWorkflow',
			},
			{
				displayName: 'Model ID',
				name: 'modelId',
				type: 'string',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Input Data Mode',
				name: 'inputDataMode',
				type: 'options',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'] } },
				options: [
					{ name: 'Raw JSON', value: 'raw' },
					{ name: 'Key-Value Form', value: 'form' },
				],
				default: 'form',
			},
			{
				displayName: 'Input Data (JSON)',
				name: 'inputDataRaw',
				type: 'json',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'], inputDataMode: ['raw'] } },
				default: '{}',
				description: 'Raw JSON input for the model',
				required: true,
			},
			{
				displayName: 'Input Data (Fields)',
				name: 'inputDataForm',
				type: 'fixedCollection',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'], inputDataMode: ['form'] } },
				placeholder: 'Add Input',
				default: {},
				options: [
					{
						name: 'inputs',
						displayName: 'Inputs',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								required: true,
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'File Input',
				name: 'fileInput',
				type: 'boolean',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'] } },
				default: false,
				description: 'Whether to use binary file input and upload it before running the model',
			},
            {
                displayName: 'File Input Name',
                name: 'fileInputName',
                type: 'string',
                displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'], fileInput: [true] } },
                default: 'file_url',
                description: 'The name of the field under which the uploaded file URL will be sent in the JSON request',
            },
			{
				displayName: 'Polling Interval (Sec)',
				name: 'pollingInterval',
				type: 'number',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'] } },
				default: 5,
			},
			{
				displayName: 'Timeout (Sec)',
				name: 'timeout',
				type: 'number',
				displayOptions: { show: { resource: ['workflow'], workflowOperation: ['modelWorkflow'] } },
				default: 300,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('falAiCredentials') as { apiKey: string };

		const { fal } = await import('@fal-ai/client');
		fal.config({ credentials: credentials.apiKey });

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (resource === 'model') {
					const operation = this.getNodeParameter('modelOperation', i) as 'runSync' | 'runAsync';
					const modelId = this.getNodeParameter('modelId', i) as string;
					let input: Record<string, any> = {};
					const inputDataMode = this.getNodeParameter('inputDataMode', i) as 'raw' | 'form';
					if (inputDataMode === 'raw') {
						input = JSON.parse(this.getNodeParameter('inputDataRaw', i) as string);
					} else {
						const form = this.getNodeParameter('inputDataForm', i, {}) as { inputs?: { key: string; value: any }[] };
						if (form.inputs) {
							for (const { key, value } of form.inputs) {
								input[key] = value;
							}
						}
					}

					if (operation === 'runSync') {
						const result = await fal.run(modelId, { input });
						responseData = result;
					} else if (operation === 'runAsync') {
						const result = await fal.queue.submit(modelId, { input });
						responseData = { requestId: result.request_id };
					}
				}

				else if (resource === 'queue') {
					const operation = this.getNodeParameter('queueOperation', i) as 'getStatus' | 'getResult';
					const modelId = this.getNodeParameter('modelId', i) as string;
					const requestId = this.getNodeParameter('requestId', i) as string;
					if (operation === 'getStatus') {
						const status = await fal.queue.status(modelId, { requestId });
						responseData = status;
					} else if (operation === 'getResult') {
						const result = await fal.queue.result(modelId, { requestId });
						responseData = result;
					}
				}

				else if (resource === 'storage') {
					const operation = this.getNodeParameter('storageOperation', i) as 'upload';
					if (operation === 'upload') {
						const fileProp = this.getNodeParameter('file', i) as string;
						const mimeType = this.getNodeParameter('mimeType', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, fileProp);
						const fileBuffer = Buffer.from(binaryData.data, 'base64');
						const detectedType = (await fileTypeFromBuffer(fileBuffer))?.mime || mimeType || binaryData.mimeType || 'application/octet-stream';
						const url = await fal.storage.upload(new Blob([fileBuffer], { type: detectedType }));
						responseData = { url };
					}
				}

				else if (resource === 'workflow') {
					const operation = this.getNodeParameter('workflowOperation', i) as 'modelWorkflow';
					if (operation === 'modelWorkflow') {
						const modelId = this.getNodeParameter('modelId', i) as string;
						const inputDataMode = this.getNodeParameter('inputDataMode', i) as 'raw' | 'form';
						let input: Record<string, any> = {};
						if (inputDataMode === 'raw') {
							input = JSON.parse(this.getNodeParameter('inputDataRaw', i) as string);
						} else {
							const form = this.getNodeParameter('inputDataForm', i, {}) as { inputs?: { key: string; value: any }[] };
							if (form.inputs) {
								for (const { key, value } of form.inputs) {
									input[key] = value;
								}
							}
						}
						const fileInput = this.getNodeParameter('fileInput', i, false) as boolean;
						if (fileInput) {
							const fileProp = this.getNodeParameter('file', i) as string;
                            const fileInputName = this.getNodeParameter('fileInputName', i, 'file_url') as string;
							const mimeType = this.getNodeParameter('mimeType', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, fileProp);
							const fileBuffer = Buffer.from(binaryData.data, 'base64');
							const detectedType = (await fileTypeFromBuffer(fileBuffer))?.mime || mimeType || binaryData.mimeType || 'application/octet-stream';
							const url = await fal.storage.upload(new Blob([fileBuffer], { type: detectedType }));
							input[fileInputName] = url;
						}
						const submitResult = await fal.queue.submit(modelId, { input });
						const requestId = submitResult.request_id;
						const pollingInterval = this.getNodeParameter('pollingInterval', i, 5) as number;
						const timeout = this.getNodeParameter('timeout', i, 300) as number;
						const start = Date.now();
						let status;
						while (true) {
							await new Promise(res => setTimeout(res, pollingInterval * 1000));
							status = await fal.queue.status(modelId, { requestId });
							const s = String(status.status);
							if (s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELLED') break;
							if ((Date.now() - start) / 1000 > timeout) throw new NodeOperationError(this.getNode(), { message: 'Timeout waiting for model result' }, { itemIndex: i });
						}
						if (String(status.status) !== 'COMPLETED') throw new NodeOperationError(this.getNode(), { message: 'Model run failed: ' + status.status }, { itemIndex: i });
						const result = await fal.queue.result(modelId, { requestId });
						responseData = result;
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(data => ({ json: data, pairedItem: i })));
				} else {
					returnData.push({ json: responseData, pairedItem: i });
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, error, pairedItem: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}
		return [returnData];
	}
}