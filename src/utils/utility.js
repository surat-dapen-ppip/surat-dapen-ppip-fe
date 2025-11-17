export const GetPositionName = (value) => {
    switch (value) {
        case 1:
            return 'Direktur'
        case 2:
            return 'Kepala Bidang'
        case 3:
            return 'Staf / Pegawai'
        default:
            return ""
    }
}

export const GetEventIDName = (value) => {
    switch (value) {
        case 0:
            return 'dibaca'
        case 1:
            return 'disposisi'
        case 2:
            return 'dialihkan'
        case 3:
            return 'disubmit'
        case 4:
            return 'diterima'
        case 5:
            return 'ditolak'
        default:
            return ""
    }
}

export const GetSubmitIDName = (value) => {
    switch (value) {
        case 1:
            return 'disubmit tanpa surat'
        case 2:
            return 'disubmit dengan surat'
        default:
            return "disubmit"
    }
}

export const GetCurrentDateInISOFormat = () => {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
}


export const GetCurrentMonthInRoman = () => {
    const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const currentMonth = new Date().getMonth(); // getMonth() returns 0-11 (January is 0)
    return romanNumerals[currentMonth];
}

export const ZeroPad = (input) => {
    if (input == undefined ){
        return ""
    }
    // Convert the input to a string and pad with zeros
    return input.toString().padStart(4, '0');
}

export const formatCurrentWIBTimestamp = () => {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const getPart = (type, fallback = '00') =>
        parts.find((part) => part.type === type)?.value ?? fallback;

    const day = getPart('day');
    const month = getPart('month');
    const year = getPart('year', '0000');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');

    return `${day}-${month}-${year} ${hour}:${minute}:${second} WIB`;
};