const getTextColor = (backgroundColor: string) => {
    // hex를 rgb로 변환
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 밝기 계산 (YIQ 공식)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 밝기에 따라 검은색 또는 흰색 반환
    return brightness > 192 ? "#000000" : "#FFFFFF";
};


export default getTextColor;