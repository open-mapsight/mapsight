import {
	type FormEvent,
	type ReactElement,
	type ReactNode,
	useCallback,
} from "react";

import {useCountAggregatorI18n} from "../../context/count-aggregator-provider.js";
import {cn} from "../../lib/utils.js";

const stepChevronClass =
	"msca:relative msca:z-10 msca:[clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]";

function WizardStep({
	label,
	isActive,
	isClickable,
	onClick,
}: {
	label: string;
	isActive: boolean;
	isClickable: boolean;
	onClick?: () => void;
}): ReactElement {
	const className = cn(
		"msca:flex msca:w-full msca:items-center msca:px-4 msca:py-2.5 msca:text-sm",
		isActive
			? "msca:bg-(--msca-color-surface) msca:font-bold msca:text-gray-900"
			: "msca:bg-gray-100 msca:text-gray-600",
		isClickable &&
			"msca:cursor-pointer msca:hover:text-(--msca-color-primary)",
		isActive && stepChevronClass,
	);

	if (isClickable && onClick !== undefined) {
		return (
			<button type="button" className={className} onClick={onClick}>
				{label}
			</button>
		);
	}

	return <span className={className}>{label}</span>;
}

export function SteppedWizardShell({
	step,
	onStepChange,
	onSubmit,
	children,
}: {
	step: 0 | 1;
	onStepChange: (step: 0 | 1) => void;
	onSubmit: (event: FormEvent) => void;
	children: ReactNode;
}): ReactElement {
	const {t} = useCountAggregatorI18n();
	const handleSelectionClick = useCallback(() => {
		if (step > 0) {
			onStepChange(0);
		}
	}, [onStepChange, step]);

	return (
		<div className="msca:bg-(--msca-color-surface)">
			<ol className="msca:flex msca:w-full msca:list-none msca:border-b msca:border-(--msca-color-border)">
				<li className="msca:flex msca:min-w-0 msca:flex-1">
					<WizardStep
						label={t("step.selection")}
						isActive={step === 0}
						isClickable={step > 0}
						onClick={handleSelectionClick}
					/>
				</li>
				<li className="msca:flex msca:min-w-0 msca:flex-1">
					<WizardStep
						label={t("step.chart")}
						isActive={step === 1}
						isClickable={false}
					/>
				</li>
			</ol>

			<form className="msca:p-6" onSubmit={onSubmit}>
				{children}
			</form>
		</div>
	);
}
