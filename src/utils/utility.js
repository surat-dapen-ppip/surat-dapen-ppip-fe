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

export const CanAccessMessagePage = (pageType, data, currentUserUID) => {
    if (!data || !currentUserUID) {
        return false
    }

    const reviewerList = data.ReviewerUID ? data.ReviewerUID.split(',') : []
    const ccList = data.CCUID ? data.CCUID.split(',') : []
    const recipientList = data.RecipientUID ? data.RecipientUID.split(',') : []

    const isDrafter = data.DrafterUID == currentUserUID
    const isReviewer = reviewerList.includes(currentUserUID)
    const isApprover = data.ApproverUID == currentUserUID
    const isCC = ccList.includes(currentUserUID)
    const isRecipient = recipientList.includes(currentUserUID)

    switch (pageType) {
        case 'draft':
            // Only the drafter may continue editing their own draft (status 3)
            return data.MessageStatus == 3 && isDrafter
        case 'revision':
            // Only the drafter may resubmit a message sent back for revision (status 5)
            return data.MessageStatus == 5 && isDrafter
        case 'review':
            // Status 41 needs a reviewer's action, status 42 needs the approver's
            if (data.MessageStatus == 41) {
                return isReviewer
            }
            if (data.MessageStatus == 42) {
                return isApprover
            }
            return false
        case 'view':
            // Read-only view is for anyone involved while waiting on review/approval, or once approved
            return [2, 41, 42].some((status) => data.MessageStatus == status)
                && (isDrafter || isReviewer || isApprover || isCC || isRecipient)
        default:
            return false
    }
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