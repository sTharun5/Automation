export default function VerificationResultModal({ isOpen, onClose, verificationDetails, summary }) {
    if (!isOpen) return null;

    const { name, company, dates } = verificationDetails || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
                    <h2 className="text-2xl font-bold">📄 Document Verification Results</h2>
                    <p className="text-red-100 text-sm mt-1">Your document could not be verified</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-gray-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="font-semibold text-gray-800">{summary}</p>
                    </div>

                    {/* Name Verification */}
                    {name && (
                        <div className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{name.found ? "✅" : "❌"}</span>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">Student Name</h3>
                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                        <p><span className="font-semibold">Searched for:</span> {name.searched}</p>
                                        {name.found ? (
                                            <>
                                                <p className="text-green-700"><span className="font-semibold">Status:</span> Found in document</p>
                                                <p><span className="font-semibold">Matched parts:</span> {name.matchedParts.join(", ")} ({name.matchedParts.length}/{name.totalParts})</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-red-700"><span className="font-semibold">Status:</span> Not found in document</p>
                                                <p><span className="font-semibold">Required:</span> At least {name.requiredParts} of {name.totalParts} name parts</p>
                                                {name.matchedParts.length > 0 && (
                                                    <p className="text-orange-600"><span className="font-semibold">Partial match:</span> {name.matchedParts.join(", ")}</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Verification */}
                    {company && (
                        <div className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{company.found ? "✅" : "❌"}</span>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">Company Name</h3>
                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                        <p><span className="font-semibold">Searched for:</span> {company.searched}</p>
                                        {company.found ? (
                                            <p className="text-green-700"><span className="font-semibold">Status:</span> Found in document</p>
                                        ) : (
                                            <p className="text-red-700"><span className="font-semibold">Status:</span> Not present in document</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Date Verification — year / month check */}
                    {dates && (
                        <div className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{dates.found ? "✅" : "⚠️"}</span>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">Date Period (Year / Month)</h3>
                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                        <p><span className="font-semibold">Period:</span> {dates.period}</p>
                                        {dates.found ? (
                                            <>
                                                <p className="text-green-700"><span className="font-semibold">Status:</span> Year and month found in document</p>
                                                {dates.yearsFound.length > 0 && (
                                                    <p><span className="font-semibold">Years found:</span> {dates.yearsFound.join(", ")}</p>
                                                )}
                                                {dates.monthsFound.length > 0 && (
                                                    <p><span className="font-semibold">Months found:</span> {dates.monthsFound.join(", ")}</p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className={dates.yearMatched ? "text-green-700" : "text-orange-600"}>
                                                    {dates.yearMatched ? "✅" : "⚠️"}
                                                    <span className="font-semibold ml-2">Year:</span>
                                                    {dates.yearMatched ? ` Found (${dates.yearsFound.join(", ")})` : " Not found"}
                                                </p>
                                                {!dates.yearMatched && (
                                                    <p className="text-xs text-gray-500 ml-6">Searched for: {dates.yearsSearched.join(", ")}</p>
                                                )}
                                                <p className={dates.monthMatched ? "text-green-700" : "text-orange-600"}>
                                                    {dates.monthMatched ? "✅" : "⚠️"}
                                                    <span className="font-semibold ml-2">Month:</span>
                                                    {dates.monthMatched ? ` Found (${dates.monthsFound.join(", ")})` : " Not found"}
                                                </p>
                                                {!dates.monthMatched && (
                                                    <p className="text-xs text-gray-500 ml-6">Searched for: {dates.monthsSearched.join(", ")}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ NEW: Strict Start Date & End Date Matching */}
                    {dates && (dates.startDateSearched || dates.endDateSearched) && (
                        <div className="border rounded-lg p-4 bg-slate-50">
                            <h3 className="font-bold text-lg text-gray-800 mb-3">📅 Strict Date Verification</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                The dates you submitted must appear <strong>exactly</strong> in both documents (ITI &amp; ITO files).
                            </p>
                            <div className="space-y-3">
                                {/* Start Date */}
                                <div className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${dates.startDateMatched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                    <span className="text-xl mt-0.5">{dates.startDateMatched ? "✅" : "❌"}</span>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800">
                                            Start Date: <span className="font-mono">{dates.startDateSearched}</span>
                                        </p>
                                        {dates.startDateMatched ? (
                                            <p className="text-green-700 text-xs mt-0.5">
                                                Found in document as: <span className="font-mono">{dates.startDateVariantsFound?.[0]}</span>
                                            </p>
                                        ) : (
                                            <p className="text-red-700 text-xs mt-0.5">
                                                ❌ <strong>Not found</strong> — The start date in your document does not match what you entered.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* End Date */}
                                <div className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${dates.endDateMatched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                    <span className="text-xl mt-0.5">{dates.endDateMatched ? "✅" : "❌"}</span>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800">
                                            End Date: <span className="font-mono">{dates.endDateSearched}</span>
                                        </p>
                                        {dates.endDateMatched ? (
                                            <p className="text-green-700 text-xs mt-0.5">
                                                Found in document as: <span className="font-mono">{dates.endDateVariantsFound?.[0]}</span>
                                            </p>
                                        ) : (
                                            <p className="text-red-700 text-xs mt-0.5">
                                                ❌ <strong>Not found</strong> — The end date in your document does not match what you entered.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Items */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 mb-2">⚠️ What to do next:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {!name?.found && <li>Ensure the document contains your full name as registered</li>}
                            {!company?.found && <li>The offer letter must clearly mention the company name &quot;{company?.searched}&quot;</li>}
                            {!dates?.startDateMatched && (
                                <li>
                                    <strong>Start Date mismatch:</strong> The date <span className="font-mono">{dates?.startDateSearched}</span> was not found in your ITI/ITO document.
                                    Ensure your PDF mentions this exact date (e.g. DD/MM/YYYY, DD Month YYYY, or DD-MM-YYYY).
                                </li>
                            )}
                            {!dates?.endDateMatched && (
                                <li>
                                    <strong>End Date mismatch:</strong> The date <span className="font-mono">{dates?.endDateSearched}</span> was not found in your ITI/ITO document.
                                    Ensure your PDF mentions this exact date in a recognisable format.
                                </li>
                            )}
                            <li>Make sure you uploaded the correct ITI (Aim) and ITO (Offer Letter) PDFs</li>
                            <li>The document should not be a scanned image — use a digital PDF with searchable text</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        Close & Fix Documents
                    </button>
                </div>
            </div>
        </div>
    );
}
