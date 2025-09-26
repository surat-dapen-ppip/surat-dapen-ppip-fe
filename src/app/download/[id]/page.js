'use client'
import { getDownloadFile, getFileByFolder, getFileByUID, getShareFilePublicVerify, getShareFolderPublicVerify } from "@/services/archive-old"
import { message, Space, Table } from "antd"
import { useEffect, useState } from "react"
import { MdPictureAsPdf } from "react-icons/md"

export default function PageDownload ({params}){
    
    // const [data,setData] = useState({
    //     uid:"",
    //     name_file:"",
    //     updated_at:""
    // })
    const [data,setData] = useState([])
    const [dataVerify,setDataVerify] = useState({
        archive_upload_uid:"",
        shared_by:""
    })

     const fetchAllFolders = async () => {

       let  url_decode = decodeURIComponent(params.id)
       try {
          const response = await getShareFolderPublicVerify(url_decode)
          
          if (response) {
              setDataVerify(response.data)
              const file = await getFileByFolder(response.data.folder_uid)
              if (file) {
                  setData(file.data)
                  return file.data
              }else{
                message.error("Gagal download file")
              }
              // const file = await getFileByUID(response.data.archive_upload_uid)
              // if (file) {
              //     setData(file.data)
              //     return file.data
              // }else{
              //     return -1
              // }
          }else{
            message.error("Gagal download file")
          }
        } catch (error) {
          message.error(error.error)
          
        }
    }

    useEffect(() => {
        fetchAllFolders()
    }, [])
    
    // const handleDownloadFile = async(data) =>{
    //     // let userUid =  localStorage.getItem("UserUID")
    //     try {
    //         const response = await getDownloadFile(data.uid,dataVerify.shared_by)
            
    //         const url = window.URL.createObjectURL(new Blob([response]));
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = data.name_file;
    //         link.click();
    //         message.success("Berhasil download file")
    //         return response.data
    //     } catch (error) {
    //         message.error("Gagal download file")
    //     }
    //   }

    const handleDownloadFile = async(record) =>{
        // setLoadingSubmitFolder(true)
        // let userUid =  localStorage.getItem("UserUID")
        try {
            const response = await getDownloadFile(record.uid,dataVerify.shared_by)
            
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.download = record.name_file;
            link.click();
            message.success("Berhasil download file")
            return response.data
        } catch (error) {
            message.error("Gagal download file")
        }
      }

      const columns = [
        {
          title: 'Nama Dokumen',
          dataIndex: 'name_file',
          key: 'name_file',
          render: (text) => <a>{text}</a>,
        },
        {
          title: 'Tanggal Upload',
          dataIndex: 'updated_at',
          key: 'updated_at',
          render:(text)=>FormatDate(text)
        },
        {
          title: 'Action',
          key: 'action',
          render: (_, record) => (
            <Space size="middle">
              <button onClick={()=>handleDownloadFile(record)}>Unduh</button>
            </Space>
          ),
        },
      ];

    return(
        <div className="bg-slate-100 flex flex-col justify-center items-center p-2 h-screen">
            {/* <div className="bg-white p-5 flex flex-col rounded justify-center items-center">
                <MdPictureAsPdf size={50} />
                <div className="font-semibold">{data.name_file}</div>
                <div className="text-xs mt-1">{FormatDate(data.updated_at)}</div>
                <button className="mt-2 border border-green-500 text-green-500 rounded p-2" onClick={()=>handleDownloadFile(data)}> Unduh </button>
            </div> */}
            <Table columns={columns} dataSource={data} pagination={false} />
        </div>
    )
}

const FormatDate = (isoDate) => {
    const date = new Date(isoDate);
  
    const formattedDate = date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  
    return formattedDate
  };