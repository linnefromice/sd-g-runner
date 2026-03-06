import type { HowToPlayContent } from './how-to-play.types';

export const howToPlayJa: HowToPlayContent = {
  title: '遊び方',
  backToTitle: 'タイトルへ',
  sections: {
    basicControls: {
      title: 'BASIC CONTROLS',
      items: {
        move: { label: '移動', desc: '画面をドラッグしてメカを移動。指に追従します。' },
        tapToMove: { label: 'タップ移動', desc: '画面をタップすると、メカが自動でその地点へ滑らかに移動します。' },
        shooting: { label: '射撃', desc: 'メカは自動で射撃します。ボタン操作は不要です。' },
        pause: { label: 'ポーズ', desc: 'ポーズボタン（右上）をタップしてゲームを一時停止。' },
      },
    },
    gates: {
      title: 'GATES',
      description: 'ゲートは対になった柱としてスクロールしてきます。片側を通過すると効果が発動。タイプごとに色分けされています。',
      items: {
        enhance: {
          label: 'Enhance',
          desc: 'ステージ中ステータスを永続強化。例: ATK +5, SPD +10%, Fire Rate +20%。',
          extra: 'Combo +1 — 連続EnhanceゲートでComboゲージが蓄積。',
        },
        recovery: {
          label: 'Recovery',
          desc: 'HPを回復。固定値（HP +20, +30）または割合（HP +50%）。',
          extra: 'Comboゲージに影響なし。',
        },
        tradeoff: {
          label: 'Tradeoff',
          desc: '一つのステータスが上がり、別のステータスが下がる。例: ATK↑ SPD↓, SPD↑ ATK↓, Fire Rate↑ ATK↓。',
          extra: 'Comboゲージが0にリセット。慎重に選びましょう。',
        },
        refit: {
          label: 'Refit',
          desc: 'メカを別の形態に切り替え（Heavy ArtilleryまたはHigh Speed）。ステータスが全変。',
          extra: 'Comboゲージが0にリセット。',
        },
      },
    },
    gateLayouts: {
      title: 'GATE LAYOUTS',
      items: {
        forced: { label: '強制', desc: 'ゲートが全幅を覆うため、必ず片側を通過しなければなりません。慎重に選びましょう。' },
        optional: { label: '任意', desc: 'ゲートに隙間があり、完全に回避するか片側を通過できます。' },
      },
    },
    comboAwakening: {
      title: 'COMBO & AWAKENING',
      items: {
        comboGauge: { label: 'Comboゲージ', desc: 'Enhanceゲート3連続通過でComboゲージが満タン（HUD上の3セグメント）。' },
        awakenedForm: { label: 'Awakened形態', desc: 'Comboゲージが満タンになると、メカがAwakened形態に変形（10秒間）— ATK 2倍、ホーミング弾、無敵。' },
        comboReset: { label: 'Comboリセット', desc: 'ダメージ、Tradeoffゲート通過、Refitゲート通過でComboが0にリセットされます。' },
      },
    },
    transform: {
      title: 'TRANSFORM',
      items: {
        transformGauge: { label: 'Transformゲージ', desc: '時間経過、敵撃破（+8）、ゲート通過（+12）で蓄積。満タンで変形可能。' },
        howToTransform: { label: '変形方法', desc: 'ゲージ満タン時にTFボタン（右下）をタップ。PrimaryとSecondary形態を切り替え。' },
        formSelection: { label: '形態選択', desc: 'ステージ開始前に2つの形態を選択。Primaryが初期形態、Secondaryが変形先。' },
        refitGates: { label: 'Refitゲート', desc: 'RefitゲートはTransformゲージに関係なく形態を強制変更。選択ペア外の形態になることも。' },
      },
    },
    mechaForms: {
      title: 'MECHA FORMS',
      items: {
        standard: { label: 'Standard', desc: 'バランス型。特殊能力なし。初心者向け。' },
        heavyArtillery: { label: 'Heavy Artillery', desc: '高ATK（1.8倍）、低移動速度（0.8倍）・低発射率（0.6倍）。弾が爆発。' },
        highSpeed: { label: 'High Speed', desc: '高移動速度（1.4倍）・高発射率（1.5倍）、低ATK（0.7倍）。弾が貫通。' },
        awakened: { label: 'Awakened', desc: 'Comboでのみ発動（選択不可）。ATK 2倍、発射率1.3倍、3連ホーミング弾、無敵。10秒間。' },
      },
    },
    combat: {
      title: 'COMBAT',
      items: {
        enemies: { label: '敵', desc: '固定敵はその場に滞空。巡回敵は左右に移動。突進敵はプレイヤーに向かって突進。' },
        damageIFrame: { label: 'ダメージ & 無敵時間', desc: '被弾時にダメージを受け、1.5秒間無敵に（メカが点滅）。' },
        bossStages: { label: 'Bossステージ', desc: 'Bossがいるステージでは背景が減速、敵の出現が停止。Bossを倒すとクリア。' },
        exGauge: { label: 'EXゲージ', desc: '敵撃破やゲート通過で蓄積。（EX Burstは今後実装予定）' },
      },
    },
    scoringProgression: {
      title: 'SCORING & PROGRESSION',
      items: {
        score: { label: 'Score', desc: '敵撃破（100-200 pts）、ゲート通過（150 pts）、ステージクリア（1000-3000 pts）でポイント獲得。' },
        credits: { label: 'Credits', desc: '敵撃破やステージクリアで獲得する通貨。アップグレードや形態アンロックに使用。' },
        upgrades: { label: 'Upgrades', desc: 'Upgrade画面から基本ATK、HP、Speedを永続強化。全ての今後のランに適用。' },
        stageClear: { label: 'Stage Clear', desc: '通常ステージは時間経過でクリア。BossステージはBoss撃破でクリア。' },
      },
    },
  },
};
