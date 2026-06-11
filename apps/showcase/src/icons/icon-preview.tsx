import {
	type IconSpec,
	type IconVariant,
	formatMapsightIcon,
} from "@mapsight/traffic-style/runtime-dev";
import {useMapsightIcon} from "@mapsight/ui/hooks/useMapsightIcon";

const VARIANTS: IconVariant[] = ["default", "small", "xsmall", "plain"];

export function IconPreview({spec}: {spec: IconSpec}) {
	return (
		<div className="preview-grid">
			{VARIANTS.map((variant) => (
				<VariantPreview
					key={variant}
					mapsightIconId={formatMapsightIcon(spec)}
					variant={variant}
					label={variant}
				/>
			))}
		</div>
	);
}

function VariantPreview({
	mapsightIconId,
	variant,
	label,
}: {
	mapsightIconId: string;
	variant: IconVariant;
	label: string;
}) {
	const {src, bitmap, loading} = useMapsightIcon(mapsightIconId, variant);

	return (
		<div className="preview-item">
			{src ? (
				<img
					src={src}
					alt=""
					width={bitmap?.logicalWidth}
					height={bitmap?.logicalHeight}
				/>
			) : (
				<div style={{width: 34, height: 34}}>{loading ? "…" : ""}</div>
			)}
			<span>{label}</span>
		</div>
	);
}
