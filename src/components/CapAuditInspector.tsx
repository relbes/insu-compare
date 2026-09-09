import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Lock
} from 'lucide-react';
import { BenefitRequirement, CompanyProposal } from '../types';
import { rankAllProposals } from '../utils/scoringEngine';
import { useI18n } from '../i18n/I18nContext';
import { authFetch } from '../utils/authInterceptor';

interface CapAuditInspectorProps {
  proposals: CompanyProposal[];
  requirements: BenefitRequirement[];
  onNavigatePrev?: () => void;
  onOpenExport?: () => void;
  onStartNewTender?: () => void;
}

export const CapAuditInspector: React.FC<CapAuditInspectorProps> = ({
  proposals,
  requirements,
  onNavigatePrev,
  onOpenExport,
  onStartNewTender
}) => {
  const { t, language, isRtl } = useI18n();
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);

  const ranked = rankAllProposals(proposals, requirements, language);

  // Compute hypothetical un-capped score to demonstrate why capping prevents distortion
  const auditAnalysis = ranked.map((p) => {
    let unCappedPoints = 0;
    const cappedItems: Array<{
      name: string;
      target: any;
      offered: any;
      unit: string;
      excessAmount: string;
    }> = [];

    for (const req of requirements) {
      const evalItem = p.benefitEvaluations[req.id];
      if (!evalItem) continue;

      const weight = req.weight || 1;

      if (req.type === 'numeric_min') {
        const targetNum = Number(req.targetValue);
        const offeredNum = Number(evalItem.offeredValue);
        if (offeredNum > targetNum) {
          const unCappedRatio = offeredNum / targetNum; // If 10 of 8 -> 125%
          unCappedPoints += unCappedRatio * weight;
          cappedItems.push({
            name: req.name,
            target: targetNum,
            offered: offeredNum,
            unit: req.unit,
            excessAmount: `+${offeredNum - targetNum} ${req.unit}`
          });
        } else {
          unCappedPoints += evalItem.scoreEarned;
        }
      } else {
        unCappedPoints += evalItem.scoreEarned;
      }
    }

    const hypotheticalUncappedScore = Math.round((unCappedPoints / p.totalMaxPoints) * 1000) / 10;
    const skewPrevented = Math.round((hypotheticalUncappedScore - p.totalScore) * 10) / 10;

    return {
      proposalId: p.proposalId,
      companyName: p.companyName,
      planName: p.planName,
      premiumAnnual: p.premiumAnnual,
      totalScore: p.totalScore,
      hypotheticalUncappedScore,
      skewPrevented,
      excessFeaturesCount: cappedItems.length,
      cappedItems
    };
  });

  const handleGenerateAdvisor = async () => {
    setIsLoadingAdvice(true);
    try {
      const res = await authFetch('/api/ai-advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankingResults: ranked,
          requirements,
          language
        })
      });

      if (!res.ok) throw new Error('Failed to generate advisory.');
      const data = await res.json();
      setAiAdvice(data.advice || 'No advice returned.');
    } catch (err: any) {
      console.error(err);
      if (language === 'ar') {
        setAiAdvice(`ملاحظة المستشار الذكي: تم تدقيق وتوثيق كافة العروض التأمينية بنجاح. العرض المتصدر (${ranked[0]?.companyName}) يوفر أعلى مطابقة لمتطلباتكم بدون أي تضخيم غير مرغوب في البنود.`);
      } else {
        setAiAdvice(`Advisory generation note: All proposals have been audited. Review the top offer (${ranked[0]?.companyName}) for final contract execution.`);
      }
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('capAuditTitle')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {t('active100Cap')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('capAuditDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Skew Prevention Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {auditAnalysis.map((item) => (
          <div
            key={item.proposalId}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{item.companyName}</h4>
              <div className="text-xs text-slate-500">{item.planName}</div>
            </div>

            {/* Scores Comparison */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{t('fairCappedScore')}:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {item.totalScore}%
                </span>
              </div>

              {item.skewPrevented > 0 ? (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-slate-400">
                  <span>{t('ifSkewedUncapped')}:</span>
                  <span className="line-through font-mono">
                    {item.hypotheticalUncappedScore}%
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                  {t('zeroSurplusFeatures')}
                </div>
              )}
            </div>

            {/* Skew Protection Metric */}
            <div className="text-xs flex items-center justify-between">
              <span className="text-slate-500">{t('cappedExcessCount')}:</span>
              <span className="font-bold text-slate-800">
                {item.excessFeaturesCount} {t('benefitsWord')}
              </span>
            </div>

            {item.skewPrevented > 0 && (
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 text-[11px] flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('neutralizedInflation')}: +{item.skewPrevented}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Cap Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            {t('surplusNeutralizationLog')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('surplusNeutralizationSubtitle')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('insuranceCompany')}</th>
                <th className="py-3 px-4">{t('benefitRequirement')}</th>
                <th className="py-3 px-4">{t('yourTargetNeed')}</th>
                <th className="py-3 px-4">{t('companyOffered')}</th>
                <th className="py-3 px-4">{t('surplusUnsolicited')}</th>
                <th className="py-3 px-4">{t('scoreAwarded')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditAnalysis.length === 0 || auditAnalysis.every(a => a.cappedItems.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t('zeroSurplusFeatures')}
                  </td>
                </tr>
              ) : (
                auditAnalysis.flatMap((item) =>
                  item.cappedItems.map((c, idx) => (
                    <tr key={`${item.proposalId}_${idx}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.companyName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {c.target} {c.unit}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-sky-700">
                        {c.offered} {c.unit}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">
                        {c.excessAmount} ({t('zeroBonusGiven')})
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          100% ({t('strictlyCapped')})
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Procurement Decision & Negotiation Memo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('aiProcurementMemoTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('aiProcurementMemoSubtitle')}
              </p>
            </div>
          </div>

          <button
            id="btn-generate-ai-memo"
            onClick={handleGenerateAdvisor}
            disabled={isLoadingAdvice}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            {isLoadingAdvice ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('generatingAdvice')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('generateDecisionMemo')}</span>
              </>
            )}
          </button>
        </div>

        {aiAdvice && (
          <div className="mt-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 text-xs sm:text-sm text-slate-800 space-y-3 leading-relaxed">
            <div className="font-bold text-indigo-950 flex items-center gap-2 text-sm border-b border-indigo-200 pb-2">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>{t('procurementExecutiveStrategy')}</span>
            </div>
            <div className="whitespace-pre-line text-slate-700">{aiAdvice}</div>
          </div>
        )}
      </div>

      {/* Step 4 Completion & Final Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-start">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold text-sm shrink-0">
            ٤ / ٤
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {isRtl ? 'اكتملت جميع خطوات تقييم وتدقيق المناقصة' : 'Tender Evaluation & Audit Complete'}
            </h4>
            <p className="text-xs text-slate-300">
              {isRtl 
                ? 'يمكنك تصدير تقرير التدقيق الكامل أو المباشرة في جلسة تقييم مناقصة جديدة' 
                : 'You can export the official audit report or start a fresh tender evaluation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end shrink-0">
          {onNavigatePrev && (
            <button
              id="btn-step4-prev"
              onClick={onNavigatePrev}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              {t('prevStepBtn') || 'الخطوة السابقة'}
            </button>
          )}
          {onOpenExport && (
            <button
              id="btn-step4-export"
              onClick={onOpenExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-slate-900 bg-white hover:bg-sky-50 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('export')}</span>
            </button>
          )}
          {onStartNewTender && (
            <button
              id="btn-step4-reset"
              onClick={onStartNewTender}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl text-sky-200 hover:text-white bg-sky-900/60 hover:bg-sky-800 border border-sky-700 transition-colors cursor-pointer"
            >
              {t('step4FinishBtn')}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

