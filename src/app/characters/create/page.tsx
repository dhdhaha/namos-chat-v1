"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

const CATEGORIES = [
  "シミュレーション",
  "ロマンス",
  "ファンタジー/SF",
  "ドラマ",
  "武侠/時代劇",
  "GL",
  "BL",
  "ホラー/ミステリー",
  "アクション",
  "コメディ/日常",
  "スポーツ/学園",
  "その他",
];

const SUGGESTED_HASHTAGS = [
  "コスモス",
  "女性",
  "純愛",
  "ファンタジー",
  "男性",
  "堕落",
  "BL",
  "支配",
  "策略",
  "疲弊",
  "貴族",
  "獣人",
  "誘惑",
  "破滅",
  "異世界",
  "メイド",
  "学校",
  "絶望",
  "人妻",
  "幼馴染",
  "ショタ",
  "研究員",
  "ツンデレ",
  "シミュレーション",
  "巨乳",
  "年上",
  "シスコン",
  "ヤンデレ",
  "魔王",
  "アイドル",
  "チャット",
  "青春",
  "学園",
  "일상",
  "母親",
  "超能力",
  "妹",
];

type ImageMeta = {
  file: File;
  keyword: string;
};

interface HashtagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (hashtags: string[]) => void;
  initialHashtags: string[];
}

const HashtagModal = ({
  isOpen,
  onClose,
  onComplete,
  initialHashtags,
}: HashtagModalProps) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(initialHashtags)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [customTag, setCustomTag] = useState("");
  const isLimitReached = selectedTags.size >= 5;

  if (!isOpen) return null;

  const filteredHashtags = SUGGESTED_HASHTAGS.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      if (isLimitReached) return;
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleAddCustomTag = () => {
    if (isLimitReached) return;
    if (customTag && !selectedTags.has(customTag)) {
      const newTags = new Set(selectedTags);
      newTags.add(customTag);
      setSelectedTags(newTags);
      setCustomTag("");
    }
  };

  const handleComplete = () => {
    onComplete(Array.from(selectedTags));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">ハッシュタグ登録</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <input
          type="text"
          placeholder="ハッシュタグを検索してください"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-sm text-right mb-2 text-gray-400">
          {selectedTags.size} / 5
        </p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-4 pr-2">
          {filteredHashtags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            const isDisabled = !isSelected && isLimitReached;
            return (
              <button
                key={tag}
                onClick={() => handleToggleTag(tag)}
                disabled={isDisabled}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  isSelected
                    ? "bg-red-500 text-white font-semibold"
                    : "bg-gray-600 hover:bg-gray-500"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400 mb-2">
            希望のハッシュタグが見つかりませんか？
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={isLimitReached ? "5個まで選択可能です" : "直接入力"}
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              disabled={isLimitReached}
              className="flex-grow bg-gray-700 border-gray-600 focus:ring-red-500 text-white disabled:opacity-50"
            />
            <Button
              onClick={handleAddCustomTag}
              disabled={isLimitReached}
              className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              追加
            </Button>
          </div>
        </div>
        <Button
          onClick={handleComplete}
          className="w-full bg-red-500 hover:bg-red-600 rounded-md py-2 mt-6 font-bold"
        >
          完了
        </Button>
      </div>
    </div>
  );
};

export default function CharacterCreateWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    images: [] as ImageMeta[],
    systemTemplate: "",
    detailSetting: "",
    firstSituation: "",
    firstMessage: "",
    visibility: "public",
    safetyFilter: true,
    category: "",
    hashtags: [] as string[],
  });

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  // ローディング状態管理のためのstate追加
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleChange = (
    field: string,
    value: string | boolean | string[] | ImageMeta[]
  ) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + form.images.length > 10) {
      alert("画像は最大10枚までアップロードできます。");
      return;
    }
    const newImages = files.map((file) => ({ file, keyword: "" }));
    setForm((prevForm) => ({
      ...prevForm,
      images: [...prevForm.images, ...newImages],
    }));
  };

  const openImageModal = (index: number) => {
    if (index === 0) return;
    setSelectedIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedIndex(null);
  };

  const updateKeyword = (value: string) => {
    if (selectedIndex === null) return;
    const updatedImages = form.images.map((img, i) =>
      i === selectedIndex ? { ...img, keyword: value } : img
    );
    handleChange("images", updatedImages);
  };

  // フォーム提出を処理する関数
  const handleSubmit = async () => {
    // ★★★ バリデーションチェックを追加 ★★★
    if (!form.name.trim()) {
      alert("キャラクターの名前は必須項目です。");
      return; // 名前が空の場合はここで処理を中断
    }
    // 他の必須項目があれば、ここに追加でチェックできます
    // if (!form.category) { ... }

    if (isSubmitting) return; // 重複提出を防止
    setIsSubmitting(true);

    const formData = new FormData();

    // テキストデータを追加
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("systemTemplate", form.systemTemplate);
    formData.append("detailSetting", form.detailSetting);
    formData.append("firstSituation", form.firstSituation);
    formData.append("firstMessage", form.firstMessage);
    formData.append("visibility", form.visibility);
    formData.append("safetyFilter", String(form.safetyFilter));
    formData.append("category", form.category);
    formData.append("hashtags", JSON.stringify(form.hashtags));

    // 画像ファイルとキーワードを追加
    formData.append("imageCount", String(form.images.length));
    form.images.forEach((imageMeta, index) => {
      formData.append(`image_${index}`, imageMeta.file);
      formData.append(`keyword_${index}`, imageMeta.keyword);
    });

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "サーバーリクエストに失敗しました。"
        );
      }

      const result = await response.json();
      console.log("サーバー応答:", result);
      alert("キャラクターが正常に登録されました！");
      router.push("/mypage");
    } catch (error) {
      console.error("キャラクター登録失敗:", error);
      if (error instanceof Error) {
        alert(`エラー: ${error.message}`);
      } else {
        alert("不明なエラーが発生しました。");
      }
    } finally {
      // 成功/失敗にかかわらず、提出状態をfalseに変更
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white px-4 py-8 max-w-4xl mx-auto font-sans">
        <button
          onClick={() => router.push("/mypage")}
          className="mb-4 text-pink-400 hover:underline cursor-pointer"
        >
          ← 戻る
        </button>
        <h1 className="text-xl font-bold mb-4">キャラクター作成</h1>

        <div className="flex space-x-2 border-b border-gray-700 mb-6 text-sm overflow-x-auto">
          {[
            "プロフィール",
            "キャラクター画像",
            "詳細情報",
            "開始状況",
            "その他設定",
            "ロアブック",
            "修正および登録",
          ].map((label, index) => (
            <div
              key={label}
              className={`pb-2 px-2 cursor-pointer whitespace-nowrap transition-all ${
                step === index
                  ? "border-b-2 border-pink-500 font-semibold"
                  : "text-gray-400"
              }`}
              onClick={() => setStep(index)}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <Input
              placeholder="キャラクターの名前を入力してください"
              value={form.name}
              maxLength={20}
              onChange={(e) => handleChange("name", e.target.value)}
              className="rounded-md"
            />
            <Textarea
              placeholder="キャラクター紹介文を入力してください"
              value={form.description}
              maxLength={250}
              onChange={(e) => handleChange("description", e.target.value)}
              className="h-32 rounded-md"
            />
          </div>
        )}

        {step === 1 && (
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-200">
              キャラクター画像
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              画像ファイルを選択してください（最大10枚まで）。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => openImageModal(idx)}
                  className="relative border rounded overflow-hidden w-24 h-24 cursor-pointer"
                >
                  <Image
                    src={URL.createObjectURL(img.file)}
                    alt={`image-${idx}`}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 bg-black bg-opacity-60 text-xs text-white w-full text-center px-1 py-0.5 truncate">
                    {idx === 0 ? "基本画像" : img.keyword || "クリックで入力"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-200">
              システムテンプレート
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-black"
              value={form.systemTemplate}
              onChange={(e) => handleChange("systemTemplate", e.target.value)}
            >
              <option value="">テンプレートを選択...</option>
              <option value="template1">テンプレート1</option>
              <option value="template2">テンプレート2</option>
            </select>
            <Textarea
              placeholder="キャラクターの詳細設定（外見・性格・背景など）"
              value={form.detailSetting}
              className="h-48 rounded-md"
              maxLength={5000}
              onChange={(e) => handleChange("detailSetting", e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Textarea
              placeholder="最初の状況を入力してください"
              value={form.firstSituation}
              maxLength={1000}
              className="h-40 rounded-md"
              onChange={(e) => handleChange("firstSituation", e.target.value)}
            />
            <Textarea
              placeholder="キャラクターの最初のメッセージを入力してください"
              value={form.firstMessage}
              maxLength={500}
              className="h-32 rounded-md"
              onChange={(e) => handleChange("firstMessage", e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="p-4 space-y-6">
            <div>
              <span className="block text-sm font-medium text-gray-200 mb-2">
                公開範囲
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={form.visibility === "public"}
                    onChange={() => handleChange("visibility", "public")}
                    className="form-radio text-pink-500"
                  />
                  <span className="ml-2">公開</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={form.visibility === "private"}
                    onChange={() => handleChange("visibility", "private")}
                    className="form-radio text-pink-500"
                  />
                  <span className="ml-2">非公開</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="link"
                    checked={form.visibility === "link"}
                    onChange={() => handleChange("visibility", "link")}
                    className="form-radio text-pink-500"
                  />
                  <span className="ml-2">リンク限定公開</span>
                </label>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-200 mr-4">
                セーフティフィルター
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.safetyFilter}
                  onChange={() =>
                    handleChange("safetyFilter", !form.safetyFilter)
                  }
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                <span className="ml-3 text-sm text-gray-200">
                  {form.safetyFilter ? "On" : "Off"}
                </span>
              </label>
            </div>
            <div>
              <h3 className="font-bold text-base mb-2">カテゴリー</h3>
              <p className="text-xs text-gray-400 mb-3">
                キャラクターが活動するテーマを選択してください。
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleChange("category", category)}
                    className={`py-3 px-2 rounded-md transition-colors text-center text-sm ${
                      form.category === category
                        ? "bg-red-500 font-bold"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base mb-2">ハッシュタグ</h3>
              <p className="text-xs text-gray-400 mb-3">
                最大5個、最小1個以上のタグを選択してください。
              </p>
              <div
                onClick={() => setIsHashtagModalOpen(true)}
                className="bg-gray-800 border border-gray-700 rounded-md p-3 min-h-[48px] cursor-pointer flex flex-wrap gap-2 items-center"
              >
                {form.hashtags.length === 0 ? (
                  <span className="text-gray-500">
                    ハッシュタグを登録してください。
                  </span>
                ) : (
                  form.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {step < 6 ? (
            <Button
              className="bg-pink-500 hover:bg-pink-600 cursor-pointer"
              onClick={() => setStep(step + 1)}
            >
              次の段階へ
            </Button>
          ) : (
            <Button
              className="bg-pink-500 hover:bg-pink-600 cursor-pointer disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting} // 提出中は非活性化
            >
              {isSubmitting ? "登録中..." : "登録"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>キーワード入力</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedIndex !== null && form.images[selectedIndex] && (
              <>
                <Image
                  src={URL.createObjectURL(form.images[selectedIndex].file)}
                  alt={`preview-${selectedIndex}`}
                  width={200}
                  height={200}
                  className="object-cover rounded mb-4 mx-auto"
                />
                <Input
                  placeholder="感情や状況などを入力..."
                  value={form.images[selectedIndex].keyword}
                  onChange={(e) => updateKeyword(e.target.value)}
                  className="bg-gray-900 border-gray-600 focus:ring-pink-500"
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={closeImageModal}
              className="bg-pink-500 hover:bg-pink-600"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HashtagModal
        isOpen={isHashtagModalOpen}
        onClose={() => setIsHashtagModalOpen(false)}
        initialHashtags={form.hashtags}
        onComplete={(newHashtags) => {
          handleChange("hashtags", newHashtags);
        }}
      />
    </>
  );
}
