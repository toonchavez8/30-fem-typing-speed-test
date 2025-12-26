import Image from "next/image";

const Header = () => {
	return (
		<header className="w-full flex items-center justify-between p-4 md:px-16 debug ">
			<figure>
				<Image
					src="/images/logo-large.svg"
					alt="Typing test logo"
					width={240}
					height={48}
					className="hidden md:block"
				/>
				<Image
					src="/images/logo-small.svg"
					alt="Typing test logo small"
					width={32}
					height={32}
					className="block md:hidden"
				/>
			</figure>

			<div className="flex items-center gap-2.5 ">
				<figure>
					<Image
						src="/images/icon-personal-best.svg"
						alt="trophy icon"
						width={18}
						height={18}
					/>
				</figure>
				<span className="font-normal text-FemNeutral-500 flex gap-2 items-center">
					<p className="hidden md:block">Personal best:</p>
					<p className="block md:hidden">Best: </p>
					<strong className=" text-FemNeutral-000">75 WPM</strong>
				</span>
			</div>
		</header>
	);
};

export default Header;
