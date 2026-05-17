import {useEffect, useState} from "react";

function useIsMounted() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);
	return mounted;
}

export default useIsMounted;
