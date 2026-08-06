'use client'

import { useEffect, useState } from 'react';
import { Timeline } from 'antd';
import moment from 'moment';
import { MdDrafts, MdRateReview, MdCheckCircle } from 'react-icons/md';
import { getMessageLogHistory } from '@/services/message';

const ACTION_LABEL = {
  drafted: 'Dibuat',
  reviewed: 'Direview',
  approved: 'Disetujui',
};

const ACTION_ICON = {
  drafted: <MdDrafts className='text-blue-500' size={16} />,
  reviewed: <MdRateReview className='text-amber-500' size={16} />,
  approved: <MdCheckCircle className='text-green-600' size={16} />,
};

const ACTION_COLOR = {
  drafted: 'blue',
  reviewed: 'orange',
  approved: 'green',
};

export default function LogAktivitas({ uid, compact = false }) {
  const [logHistory, setLogHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const fetchLogHistory = async () => {
      setLoading(true);
      try {
        const response = await getMessageLogHistory(uid);
        if (response && response.data) {
          setLogHistory(response.data);
        }
      } catch (error) {
        console.error('Cannot retrieve log aktivitas', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogHistory();
  }, [uid]);

  if (!loading && logHistory.length === 0) {
    return null;
  }

  const content = (
    <>
      <div className='font-semibold text-lg mb-4'>Log Aktivitas</div>
      <Timeline
        items={logHistory.map((record) => ({
          key: record.ID,
          dot: ACTION_ICON[record.Action],
          color: ACTION_COLOR[record.Action],
          children: (
            <div className='text-sm'>
              <span className='font-semibold'>
                {ACTION_LABEL[record.Action] || record.Action}
              </span>
              {' oleh '}
              <span className='font-semibold'>{record.UserName}</span>
              <div className='text-xs text-gray-500'>
                {moment(record.CreatedAt).format('DD MMM YYYY, HH:mm')}
              </div>
            </div>
          ),
        }))}
      />
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <div className='p-6 bg-white shadow-sm rounded mt-5 w-[90%]'>
      {content}
    </div>
  );
}
