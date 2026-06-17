function el(id) {return document.getElementById(id)}
function query(query, isAll=false) {return isAll ? document.querySelectorAll(query) : document.querySelector(query)}
function renderFormula(content, target) {katex.render(content, target)}

query(".formula", true).forEach(f => renderFormula(f.textContent, f));

let isValid = {
	input: false,
	normalBase: false,
	sqrtBase: false
}

/** 各<input type="number">への入力値が正しいかをチェック */
query("input[type=number]", true).forEach(e => {
	e.addEventListener("input", function() {
		const val = Number(this.value);
		let [min, max] = [Number(this.min), Number(this.max)];
		if (this.min == "") {min = -Infinity};
		if (this.max == "") {max = Infinity};
		if ((val > max || val < min) && this.value != "") {
			this.classList.add("invalid");
			isValid[this.id] = false;
		} else {
			this.classList.remove("invalid");
			isValid[this.id] = true;
		};
	});
})

/** <textarea id="numList">を変更したときの最大対応進数表示を変える処理 */
el("numList").addEventListener("input", function() {
	el("maxBase").innerHTML = this.value.length;
})

el("autoIncStart").onclick = () => {
	const interval = Number(el("autoIncInterval").value);
	setInterval(() => {
		el("input").value = Number(el("input").value) + 1;
		calc();
	}, interval * 1000);
}

/** 何かが変更されたときに計算する処理 */
query("input, textarea", true).forEach(e => {
	e.addEventListener("input", function() {
		calc();
	});
})

/** 計算 */
function calc() {
	const firstInput = Number(el("input").value);
	let input = firstInput;
	let result = "";
	let isRationalNumber = null; // 有理数かどうか
	let sqrtBase = null; // √進数のときの√の中の数
	const convType = query("input[name=convType]:checked").value;
	const numList = el("numList").value;
	let convBase = null;
	let outputConvBase = null; // 出力用のもの

	switch (convType) {
		case "normal":
			convBase = Number(el("normalBase").value);
			outputConvBase = convBase;
			break;
		case "sqrt":
			convBase = Math.sqrt(Number(el("sqrtBase").value));
			sqrtBase = Number(el("sqrtBase").value);
			outputConvBase = "\\sqrt{" + sqrtBase + "}";
			break;
		case "pi":
			convBase = Math.PI;
			outputConvBase = "\\pi";
			break;
	}

	if ((convType === "normal" && !isValid.normalBase) || (convType === "sqrt" && !isValid.sqrtBase) || !isValid.input) {
		el("output").innerHTML = "---";
		return;
	}

	// まずは変換後の桁数を調べる
	const outputDigits = Math.floor(Math.log(input) / Math.log(convBase) + 1);
	for(let i=0;i<outputDigits;i++) {
		let digitNum = null; // この繰り返しの位の数(1の位, 100の位など)
		if(convType === "sqrt") { // 平方根なら、正確にするために√125ではなく5√5のように計算したい
			digitNum = (sqrtBase ** Math.floor((outputDigits - i - 1) / 2)) * (convBase ** ((outputDigits - i - 1) % 2));
		} else {
			digitNum = convBase ** (outputDigits - i - 1);
		}
		console.log(digitNum)
		const thisDigitNum = Math.floor(input / digitNum);
		input -= thisDigitNum * digitNum;
		result += numList[thisDigitNum];
	}
	
	if (input != 0) { // 整数部分を計算してもまだ残るなら(=変換後が小数になるなら)
		result += "."; // 小数点

		for(let i=0;i<10;i++) {
			let digitNum = null;
			if(convType === "sqrt") {
				digitNum = (sqrtBase ** Math.floor((i + 1) / 2)) * (convBase ** ((i + 1) % 2));
			} else {
				digitNum = convBase ** (i + 1);
			}
			digitNum = 1 / digitNum; // 逆数にする
			const thisDigitNum = Math.floor(input / digitNum);
			input -= thisDigitNum * digitNum;
			result += numList[thisDigitNum];

			if(input == 0) {
				isRationalNumber = true;
				break;
			};
			if(i == 9) {
				isRationalNumber = false;
			}
		}
	} else {isRationalNumber = true}

	result = firstInput + "_{(10)}" + (isRationalNumber ? " = " : " \\approx ") + result + "_{(" + outputConvBase + ")}";
	renderFormula(result, el("output"));
}