/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ILocalExtension, IGalleryExtension, IExtensionIdentifier, IReportedExtension } from 'vs/platform/extensionManagement/common/extensionManagement';
import { compareIgnoreCase } from 'vs/base/common/strings';
import { ExtensionIdentifier } from 'vs/platform/extensions/common/extensions';

export function areSameExtensions(a: IExtensionIdentifier, b: IExtensionIdentifier): boolean {
	if (a.uuid && b.uuid) {
		return a.uuid === b.uuid;
	}
	if (a.id === b.id) {
		return true;
	}
	return compareIgnoreCase(a.id, b.id) === 0;
}

export class ExtensionIdentifierWithVersion {
	constructor(
		readonly identifier: IExtensionIdentifier,
		readonly version: string
	) { }

	key(): string {
		return `${this.identifier.id}-${this.version}`;
	}

	equals(o: any): boolean {
		if (!(o instanceof ExtensionIdentifierWithVersion)) {
			return false;
		}
		return areSameExtensions(this.identifier, o.identifier) && this.version === o.version;
	}
}

export function adoptToGalleryExtensionId(id: string): string {
	return id.toLocaleLowerCase();
}

export function getGalleryExtensionId(publisher: string, name: string): string {
	return `${publisher.toLocaleLowerCase()}.${name.toLocaleLowerCase()}`;
}

export function groupByExtension<T>(extensions: T[], getExtensionIdentifier: (t: T) => IExtensionIdentifier): T[][] {
	const byExtension: T[][] = [];
	const findGroup = (extension: T) => {
		for (const group of byExtension) {
			if (group.some(e => areSameExtensions(getExtensionIdentifier(e), getExtensionIdentifier(extension)))) {
				return group;
			}
		}
		return null;
	};
	for (const extension of extensions) {
		const group = findGroup(extension);
		if (group) {
			group.push(extension);
		} else {
			byExtension.push([extension]);
		}
	}
	return byExtension;
}

export function getLocalExtensionTelemetryData(extension: ILocalExtension): any {
	return {
		id: extension.identifier.id,
		name: extension.manifest.name,
		galleryId: null,
		publisherId: extension.metadata ? extension.metadata.publisherId : null,
		publisherName: extension.manifest.publisher,
		publisherDisplayName: extension.metadata ? extension.metadata.publisherDisplayName : null,
		dependencies: extension.manifest.extensionDependencies && extension.manifest.extensionDependencies.length > 0,
		// {{SQL CARBON EDIT}}
		extensionVersion: extension.manifest.version
	};
}


/* __GDPR__FRAGMENT__
	"GalleryExtensionTelemetryData" : {
		"id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"name": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"galleryId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"publisherId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"publisherName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
		"dependencies": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
		"${include}": [
			"${GalleryExtensionTelemetryData2}"
		]
	}
*/
export function getGalleryExtensionTelemetryData(extension: IGalleryExtension): any {
	return {
		id: extension.identifier.id,
		name: extension.name,
		galleryId: extension.identifier.uuid,
		publisherId: extension.publisherId,
		publisherName: extension.publisher,
		publisherDisplayName: extension.publisherDisplayName,
		dependencies: !!(extension.properties.dependencies && extension.properties.dependencies.length > 0),
		// {{SQL CARBON EDIT}}
		extensionVersion: extension.version,
		...extension.telemetryData
	};
}

export const BetterMergeId = new ExtensionIdentifier('pprice.better-merge');

export function getMaliciousExtensionsSet(report: IReportedExtension[]): Set<string> {
	const result = new Set<string>();

	for (const extension of report) {
		if (extension.malicious) {
			result.add(extension.id.id);
		}
	}

	return result;
}

export interface IBuiltInExtension {
	name: string;
	version: string;
	repo: string;
	forQualities?: ReadonlyArray<string>;
	metadata: any;
}

/**
 * Parses the built-in extension JSON data and filters it down to the
 * extensions built into this product quality.
 */
export function parseBuiltInExtensions(rawJson: string, productQuality: string | undefined) {
	const parsed: IBuiltInExtension[] = JSON.parse(rawJson);
	if (!productQuality) {
		return parsed;
	}

	return parsed.filter(ext => ext.forQualities?.indexOf?.(productQuality) !== -1);
}
