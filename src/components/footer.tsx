export const Footer = () => {
	return (
		<footer className="absolute -bottom-20 group-hover:bottom-0 transition-all duration-300 ease-linear w-full text-center py-4 text-sm group/footer ">
			Challenge by{" "}
			<a
				href="https://www.frontendmentor.io?ref=challenge"
				target="_blank"
				rel="noopener noreferrer"
				className="group-hover/footer:text-FemBlue-400 group-hover/footer:border-FemBlue-400 ease-in duration-500 border-b border-transparent "
			>
				Frontend Mentor
			</a>
			. Coded by{" "}
			<a
				href="https://www.toonchavez.dev/"
				target="_blank"
				rel="noopener noreferrer"
				className="group-hover/footer:text-FemBlue-400 group-hover/footer:border-FemBlue-400 ease-in duration-500 border-b border-transparent "
			>
				Toonchavez8
			</a>
			.
		</footer>
	);
};
export default Footer;
