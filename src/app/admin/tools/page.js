const TOOL_IFRAME_URL =
    process.env.NEXT_PUBLIC_TOOLS_IFRAME_URL ?? "http://localhost:8090/?lang=id_ID";

export default function ToolsPage() {
    return (
        <main className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-700">Tools</h2>
                <p className="text-sm text-gray-500">
                    Akses tool internal untuk merge, signature online pada server internal
                </p>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm relative">
                {/* <div style={{
                    position:'absolute',
                    backgroundColor:'#f8f9ff',
                    width:'500px',
                    height:'68px',
                    top:'0',
                    right:'0px'
                }}>
                    
                    
                </div>
                <div style={{
                    position:'absolute',
                    backgroundColor:'#f8f9ff',
                    width:'50px',
                    height:'68px',
                    top:'0',
                    left:'0px'
                }}></div> */}
                <iframe
                    title="Internal Tools"
                    src={TOOL_IFRAME_URL}
                    className="w-full border-0 h-[800px]"
                />
            </div>
        </main>
    );
}

