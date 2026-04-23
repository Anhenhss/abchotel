import React, { useEffect, useRef, useState } from 'react';
import { 
  Typography, Button, Row, Col, Space, Divider, Tag, List, Affix 
} from 'antd';
import { 
  CaretLeft, CheckCircle, MapPin, Star, CaretUp
} from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY: '#0D1821',
  GOLD: '#D4AF37',
  DARK_RED: '#8A1538',
  GRAY_BG: '#F4F7F9',
  WHITE: '#FFFFFF',
  TEXT: '#334155',
  BORDER: '#E2E8F0'
};

const ROOM_ARTICLES = [
  {
    id: "phong-hop",
    title: "Phòng Họp & Hội Nghị Cao Cấp",
    subTitle: "Không gian chuyên nghiệp kiến tạo nên những thành công mang tính bước ngoặt.",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600",
    description: "Tọa lạc tại tầng 2 của resort, với tầm nhìn bao quát toàn cảnh khuôn viên xanh mát, không gian hội nghị của chúng tôi được thiết kế theo phong cách tân cổ điển Châu Âu. Hệ thống ánh sáng tự nhiên chan hòa qua những ô cửa sổ kính vòm lớn không chỉ giúp tiết kiệm năng lượng mà còn tạo ra sự hứng khởi, minh mẫn cho mọi thành viên tham dự.\n\nĐiểm nhấn của căn phòng nằm ở hệ thống vách cách âm đa lớp chuẩn quốc tế, đảm bảo sự riêng tư tuyệt đối cho các buổi họp chiến lược mang tính bảo mật cao. Nội thất sử dụng 100% gỗ sồi nguyên khối, kết hợp cùng ghế ngồi công thái học bọc da cao cấp, mang lại cảm giác thoải mái nhất dù cuộc họp kéo dài liên tục nhiều giờ đồng hồ.\n\nĐầu tư mạnh mẽ vào công nghệ, chúng tôi trang bị hệ thống nghe nhìn tối tân bao gồm: Màn hình LED tương tác cảm ứng 85 inch độ phân giải 8K, máy chiếu laser quang học, cùng hệ thống âm thanh vòm kỹ thuật số với micro định hướng. Tốc độ đường truyền Internet tại đây được cấp một băng thông riêng biệt, đáp ứng hoàn hảo cho các buổi họp trực tuyến xuyên quốc gia mà không hề có độ trễ.\n\nNgoài ra, khu vực Foyer bên ngoài phòng họp rộng hơn 60m2 được thiết kế vô cùng trang nhã. Đây là nơi lý tưởng để tổ chức các buổi tiệc trà (Teabreak) giữa giờ với thực đơn bánh ngọt Pháp, trái cây nhiệt đới và cà phê rang xay thượng hạng, giúp các đối tác có một không gian thư giãn, giao lưu và mở rộng mối quan hệ.",
    features: ["Diện tích mặt sàn 46m² - Foyer 60m²", "Sức chứa linh hoạt từ 15 đến tối đa 30 người", "Bàn họp chữ U hoặc rạp hát tùy biến", "Hệ thống vách cách âm đa lớp tiêu chuẩn Mỹ"],
    amenities: ["Màn hình LED tương tác 85 inch 8K", "Hệ thống âm thanh hội thảo định hướng", "Đường truyền Internet Lease Line riêng biệt", "Teabreak setup theo yêu cầu (có tính phí)"]
  },
  {
    id: "doi-tieu-chuan",
    title: "Phòng Đôi Tiêu Chuẩn (Standard Twin)",
    subTitle: "Sự cân bằng hoàn hảo giữa tiện nghi hiện đại và ngân sách hợp lý.",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1600",
    description: "Phòng Đôi Tiêu Chuẩn (Standard Twin) mang đến một không gian nghỉ ngơi yên tĩnh, thanh lịch, được đo ni đóng giày cho những cặp bạn thân, đồng nghiệp hoặc các thành viên trong gia đình muốn chia sẻ phòng nhưng vẫn cần không gian ngủ riêng biệt. Sự sắp xếp thông minh giúp căn phòng dù ở diện tích tiêu chuẩn nhưng vẫn cực kỳ thoáng đãng.\n\nChúng tôi đặt chất lượng giấc ngủ của khách hàng lên hàng đầu. Hai chiếc giường đơn (kích thước 1.2m x 2.0m) được trang bị nệm cao su non tích hợp hệ thống lò xo túi độc lập. Lớp chăn ga gối đệm được làm từ 100% cotton Ai Cập với mật độ sợi siêu mịn, kết hợp với thực đơn gối ngủ (Pillow menu) cho phép bạn tự do chọn loại gối mềm, cứng hay gối thảo dược phù hợp với thói quen của mình.\n\nThiết kế nội thất mang hơi hướng Minimalism, sử dụng chủ đạo tone màu gỗ sồi sáng và màu be ấm áp. Điểm nhấn là bức tranh canvas nghệ thuật phác họa cảnh quan thiên nhiên địa phương. Dãy cửa sổ sát trần mở ra khu vườn nhiệt đới nhiều cây cối, mang lại không khí trong lành vào mỗi sớm mai.\n\nPhòng tắm tuy nhỏ gọn nhưng lại toát lên vẻ sang trọng với tường ốp đá hoa cương vân mây. Buồng tắm đứng vách kính cường lực an toàn, tích hợp hệ thống vòi sen nóng lạnh năng lượng mặt trời. Bộ vệ sinh cá nhân (Amenities) đi kèm đều là các sản phẩm hữu cơ (Organic) thân thiện với môi trường, có chiết xuất từ tinh dầu sả chanh giúp thư giãn tinh thần hiệu quả.",
    features: ["Diện tích 35m² thiết kế tối ưu hóa không gian", "2 Giường đơn cao cấp (1.2m x 2m)", "Cửa sổ lớn hướng trực diện khu vườn nhiệt đới", "Sàn gỗ tự nhiên cách âm, chống trơn trượt"],
    amenities: ["Smart TV 50 inch tích hợp Netflix", "Mini bar miễn phí (nước lọc, trà, cafe)", "Két sắt an toàn điện tử cỡ laptop", "Bộ Amenities phòng tắm Organic"]
  },
  {
    id: "thuong-dang",
    title: "Phòng Thượng Đẳng (Premier King)",
    subTitle: "Nâng tầm trải nghiệm nghỉ dưỡng cá nhân hóa với các đặc quyền thượng lưu.",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600",
    description: "Với thiết kế mở vô cùng rộng rãi cùng tâm điểm là chiếc giường King-size siêu êm ái, hạng phòng Thượng Đẳng (Premier King) là biểu tượng của sự tinh tế và lối sống phong lưu. Ngay từ khoảnh khắc mở cửa bước vào, bạn sẽ bị chinh phục bởi mùi hương tinh dầu trầm ấm áp và hệ thống rèm cửa tự động mở ra đón ánh sáng.\n\nSự phân bổ không gian trong phòng Premier King mang đậm tính nghệ thuật. Khu vực tiếp khách được tách biệt nhẹ nhàng với khu vực giường ngủ bằng một vách ngăn gỗ cắt CNC hoa văn cổ điển. Tại đây trang bị một bộ sofa nhung mềm mại cùng bàn trà nhỏ, tạo thành một 'căn hộ thu nhỏ' lý tưởng để bạn ngồi đọc một cuốn sách hay nhâm nhi ly rượu vang buổi tối.\n\nMột trong những điểm đắt giá nhất của căn phòng chính là khu vực phòng tắm mở (Open Bathroom). Bồn tắm nằm bằng sứ cao cấp được bố trí tinh tế ngay sát cạnh cửa sổ kính sát trần. Bạn có thể vừa ngâm mình trong làn nước ấm rắc đầy hoa hồng, vừa phóng tầm mắt chiêm ngưỡng cảnh quan tuyệt mỹ bên ngoài. Đương nhiên, rèm sập tự động luôn sẵn sàng nếu bạn cần sự riêng tư tuyệt đối.\n\nKhách lưu trú tại hạng phòng Thượng Đẳng sẽ nhận được những đặc quyền riêng biệt khó có thể tìm thấy ở các hạng phòng tiêu chuẩn. Quý khách sẽ được chào đón bằng một giỏ hoa quả tươi theo mùa và thức uống Detox tự làm ngay khi nhận phòng. Đặc biệt, dịch vụ dọn phòng buổi tối (Turndown Service) sẽ chuẩn bị giường ngủ của bạn thật hoàn hảo, đặt một thanh chocolate nhỏ lên gối cùng một bản nhạc nhẹ nhàng giúp bạn dễ dàng chìm vào giấc ngủ.",
    features: ["Diện tích 55m² bao gồm không gian tiếp khách", "Giường King Size tiêu chuẩn hoàng gia (2m x 2.2m)", "Tầm nhìn 180 độ bao quát cảnh quan", "Vách ngăn nghệ thuật tinh xảo"],
    amenities: ["Bồn tắm nằm thiết kế liền kề cửa sổ", "Loa Bluetooth cao cấp Marshall Acton", "Máy pha cafe viên nén Nespresso", "Dịch vụ Turndown Service buổi tối"]
  },
  {
    id: "deluxe-ocean",
    title: "Deluxe Ocean View",
    subTitle: "Đánh thức mọi giác quan, đón bình minh rực rỡ ngay trên giường ngủ.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600",
    description: "Tọa lạc tại những vị trí đắc địa nhất của tòa nhà, nơi chỉ cách bãi biển cát trắng vài chục bước chân, Deluxe Ocean View là giấc mơ của những tâm hồn yêu biển. Căn phòng cho phép bạn thu trọn vẻ đẹp bao la của đại dương xanh thẳm vào trong tầm mắt, tận hưởng âm thanh của những con sóng vỗ bờ rì rào như một bản nhạc ru ngủ tự nhiên.\n\nKiến trúc của căn phòng áp dụng triết lý 'Mang thiên nhiên vào nhà'. Toàn bộ mặt tiền hướng biển được thay thế bằng hệ thống kính cường lực Low-E chạm trần, vừa cản tia UV, cách nhiệt hiệu quả nhưng vẫn mở ra một bức tranh panorama sống động. Mỗi buổi sáng thức dậy, chỉ cần một nút bấm mở rèm, ánh bình minh đỏ rực sẽ tràn ngập khắp căn phòng.\n\nBan công của Deluxe Ocean View cực kỳ rộng rãi, được lát sàn gỗ ngoài trời chống trượt. Tại đây bố trí sẵn một bộ bàn trà nhỏ và hai chiếc ghế lười tắm nắng. Hãy tưởng tượng buổi chiều tà, bạn ngồi tại đây, nhâm nhi một ly cocktail Margarita mát lạnh và chiêm ngưỡng khoảnh khắc hoàng hôn buông xuống, biến cả bầu trời và mặt biển thành một màu tím lãng mạn.\n\nTừng chi tiết decor bên trong cũng hòa nhịp cùng hơi thở đại dương. Gam màu chủ đạo là xanh navy pastel kết hợp với màu trắng ngọc trai tinh khiết. Đèn chùm pha lê hình giọt nước, thảm trải sàn dệt họa tiết sóng biển đều được lựa chọn tỉ mỉ. Phòng tắm được trang bị hệ thống vòi sen phun mưa (Rain shower) với lực nước mạnh mẽ, mang lại cảm giác sảng khoái như đang tắm dưới một thác nước tự nhiên.",
    features: ["Diện tích 48m² thoáng đãng", "Giường đôi lớn (King Size) bọc đệm êm ái", "Ban công riêng biệt hướng biển trực diện", "Hệ kính cách nhiệt Low-E chạm trần"],
    amenities: ["Khu vực ghế sofa thư giãn bên cửa sổ", "Ghế tắm nắng riêng tại ban công", "Wifi tốc độ cao băng tần 5GHz", "Dịch vụ phục vụ bữa sáng tại phòng (In-room dining)"]
  },
  {
    id: "suite-giadinh",
    title: "Family Connecting Suite",
    subTitle: "Gắn kết tình thân, sẻ chia khoảnh khắc ngọt ngào trong kỳ nghỉ gia đình.",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600",
    description: "Kỳ nghỉ gia đình luôn đòi hỏi sự tinh tế trong việc bố trí không gian: Bố mẹ cần sự lãng mạn và riêng tư, trong khi con cái cần không gian rộng rãi, an toàn để vui chơi. Family Connecting Suite chính là giải pháp hoàn hảo nhất, kết nối hai căn phòng độc lập thông qua một cánh cửa đôi (Connecting door) nằm ở vách tường chung.\n\nBước vào phòng Master dành cho bố mẹ, bạn sẽ cảm nhận ngay sự sang trọng, thanh lịch với giường King-size, khu vực bàn trang điểm và ban công ngắm cảnh. Trong khi đó, mở cánh cửa kết nối bước sang phòng của các bé, một thế giới hoàn toàn khác sẽ mở ra. Phòng trẻ em được trang trí với những dải giấy dán tường họa tiết hoạt hình vui nhộn, giường tầng an toàn hoặc hai giường đơn ngộ nghĩnh.\n\nSự thấu hiểu tâm lý trẻ nhỏ thể hiện qua việc chúng tôi trang bị sẵn một góc giải trí riêng biệt ngay trong phòng bé. Tùy theo độ tuổi, phòng sẽ được set up sẵn máy chơi game PlayStation, bộ lắp ráp Lego, hoặc lều vải teepee để các bé thỏa sức cắm trại trong nhà. Bố mẹ hoàn toàn có thể an tâm nằm nghỉ bên phòng mình mà vẫn có thể để mắt đến con qua cánh cửa mở.\n\nBên cạnh đó, hạng phòng này có thêm một khu vực bếp nhỏ (Kitchenette) khép kín. Được trang bị bồn rửa, lò vi sóng, máy hâm sữa và một tủ lạnh dung tích lớn chứa đầy nước trái cây, sữa tươi. Điều này cực kỳ tiện lợi cho các bà mẹ cần pha sữa cho em bé giữa đêm hoặc hâm nóng lại đồ ăn dặm một cách nhanh chóng nhất.",
    features: ["Tổng diện tích lên đến 90m²", "1 Giường King & 2 Giường đơn (hoặc giường tầng)", "2 Phòng tắm riêng biệt (phòng trẻ em có bồn tắm thấp)", "Thiết kế cửa thông phòng an toàn (Connecting Door)"],
    amenities: ["Góc giải trí: PlayStation / Đồ chơi / Boardgames", "Cung cấp nôi/cũi trẻ em miễn phí theo yêu cầu", "Khu vực bếp nhỏ (Kitchenette) tiện ích", "Lò vi sóng & Máy tiệt trùng/hâm sữa"]
  },
  {
    id: "executive-suite",
    title: "Executive Business Suite",
    subTitle: "Nơi tôn vinh đẳng cấp và vị thế của giới doanh nhân tinh hoa.",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600",
    description: "Được kiến tạo dành riêng cho những nhà lãnh đạo, các vị CEO và khách hàng đi công tác cần một không gian vừa sang trọng để nghỉ ngơi, vừa chuyên nghiệp để giải quyết công việc. Executive Business Suite tách biệt hoàn toàn ranh giới giữa phòng khách và phòng ngủ, tạo nên một căn hộ hạng sang đích thực giữa lòng khu nghỉ dưỡng.\n\nPhòng khách của Executive Suite toát lên uy quyền mạnh mẽ với tone màu trầm nam tính của gỗ óc chó (Walnut) và da bò thật nhập khẩu Ý. Một bộ sofa da nguyên khối đồ sộ được đặt chính giữa, đối diện là Smart TV OLED 65 inch phục vụ nhu cầu giải trí và theo dõi tin tức tài chính. Góc làm việc được thiết kế chuẩn công thái học với bàn làm việc rộng rãi, ghế lưới cao cấp Herman Miller, ổ cắm quốc tế và đèn bàn chống lóa.\n\nSự tĩnh lặng tuyệt đối là điều cốt lõi của hạng phòng này. Chúng tôi áp dụng vật liệu tiêu âm đa lớp cho cả sàn nhà và trần, đảm bảo mọi cuộc điện đàm quốc tế của quý khách không bao giờ bị làm phiền. Hệ thống lọc không khí HEPA diệt khuẩn được tích hợp trong máy lạnh giúp cung cấp những luồng khí tươi sạch nhất, bảo vệ sức khỏe cường độ cao của khách lưu trú.\n\nKhi đặt hạng phòng Executive Suite, quý khách mặc nhiên sở hữu đặc quyền VIP: Thẻ từ thang máy kích hoạt lối đi lên tầng thượng - nơi tọa lạc của Executive Lounge. Tại đây, bạn sẽ được tận hưởng thủ tục check-in/check-out hoàn toàn riêng tư, miễn phí bữa sáng tự chọn sang trọng, thưởng thức tiệc trà chiều kiểu Anh (High Tea) và không giới hạn rượu vang, cocktail cùng canapé trong giờ Happy Hour mỗi tối.",
    features: ["Diện tích 70m² phân bổ 2 không gian rõ rệt", "Phòng khách và phòng ngủ tách biệt hoàn toàn", "Góc làm việc chuẩn văn phòng hạng A", "Đặc quyền thẻ từ ra vào khu vực VIP"],
    amenities: ["Đặc quyền Executive Lounge (Trà chiều & Cocktail)", "Máy in, Scan, Photo tích hợp tại phòng làm việc", "Dịch vụ giặt là hỏa tốc 4h (Miễn phí 2 món/ngày)", "Máy lọc không khí & tạo ion âm cao cấp"]
  },
  {
    id: "penthouse-view",
    title: "The Penthouse Signature",
    subTitle: "Tuyệt tác kiến trúc giữa các tầng mây, định nghĩa lại sự xa hoa.",
    image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600",
    description: "Ngự trị kiêu hãnh trên tầng cao nhất của tòa tháp, The Penthouse Signature không chỉ là một căn phòng, đó là một dinh thự trên không mang đến tầm nhìn panorama 360 độ ngoạn mục. Từ đây, bạn có thể thâu tóm toàn bộ sự hoa lệ của thành phố lúc lên đèn cùng sự bao la vô tận của đại dương mênh mông, mang đến một cảm giác tự do và quyền lực tột đỉnh.\n\nKhông gian của Penthouse rộng đến 250m2, sở hữu thiết kế thông tầng (Duplex) với trần nhà cao tới 5 mét. Ngay khi bước vào, bạn sẽ choáng ngợp bởi chiếc đèn chùm pha lê Baccarat khổng lồ rủ xuống giữa không gian phòng khách, phản chiếu ánh sáng lấp lánh lên lớp đá cẩm thạch trắng Carrara lát sàn. Bao gồm 3 phòng ngủ lộng lẫy, mỗi phòng đều có phòng tắm walk-in closet riêng biệt.\n\nMột trong những trải nghiệm độc bản chỉ có tại Penthouse là hồ bơi vô cực nước mặn tư nhân được thiết kế lơ lửng ngoài ban công sân thượng. Hệ thống sưởi ấm nước tự động giúp bạn thoải mái bơi lội ngay cả trong những đêm se lạnh. Cạnh hồ bơi là khu vực tổ chức BBQ ngoài trời và một quầy bar mini sở hữu bộ sưu tập rượu vang, xì gà Cuba hảo hạng nhất.\n\nĐể tương xứng với đẳng cấp của căn Penthouse, dịch vụ Butler (Quản gia cá nhân) theo tiêu chuẩn Hoàng gia Anh sẽ được kích hoạt ngay từ khi bạn bước xuống sân bay. Quản gia sẽ túc trực 24/7 để sắp xếp mọi yêu cầu dù là khắt khe nhất: từ việc đặt trước bàn tại nhà hàng Michelin, thuê du thuyền ngắm hoàng hôn, cho đến việc chuẩn bị nước ngâm chân thảo mộc trước khi bạn đi ngủ.",
    features: ["Diện tích siêu khủng 250m² thông tầng", "Hồ bơi vô cực nước mặn trên không riêng biệt", "Sân thượng rộng lớn tích hợp khu vực BBQ", "Thiết kế 3 phòng ngủ Master lộng lẫy"],
    amenities: ["Dịch vụ Quản gia cá nhân (Butler Service) 24/7", "Quầy Bar riêng với bộ sưu tập rượu Vang đắt đỏ", "Thực đơn gối (Pillow menu) & Tinh dầu tùy chọn", "Xe siêu sang đón/tiễn sân bay miễn phí"]
  },
  {
    id: "presidential",
    title: "Presidential Palace (Phòng Tổng Thống)",
    subTitle: "Không gian quyền lực, nơi tiếp đón các Nguyên thủ và Siêu sao thế giới.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600",
    description: "Presidential Palace (Cung điện Tổng thống) là hạng phòng mang tính biểu tượng, tự hào là nơi an toàn và sang trọng bậc nhất của toàn bộ hệ thống ABCHOTEL. Thiết kế nội thất pha trộn hoàn hảo giữa nét cổ điển Châu Âu tráng lệ và các chi tiết mạ vàng 24K thủ công tinh xảo của nghệ nhân Châu Á. Mọi vật liệu, từ thảm dệt tay Ba Tư, đá Onyx xuyên sáng đến gỗ gụ ngàn năm, đều là những phiên bản giới hạn quý hiếm.\n\nVấn đề an ninh được đặt lên mức độ cao nhất (Tối mật). Toàn bộ hệ thống cửa sổ đều sử dụng kính chống đạn cường lực. Căn phòng có một thang máy bảo mật đi thẳng từ tầng hầm, không dừng lại ở các tầng trung gian. Bên trong bao gồm phòng ngủ chính rộng 100m2, hai phòng ngủ phụ cho thư ký/trợ lý, một phòng làm việc độc lập có vách chống máy quét nghe lén, và một phòng ăn hoàng gia sức chứa 12 ghế.\n\nPresidential Palace sở hữu những tiện ích cá nhân hóa vượt khỏi trí tưởng tượng của một khách sạn thông thường. Tại đây có một phòng chiếu phim gia đình (Home Cinema) chuẩn IMAX với ghế bọc da ngả lưng. Một khu vực Spa & Thể thao thu nhỏ bao gồm máy chạy bộ đa năng, phòng xông hơi khô (Sauna), xông hơi ướt (Steambath) và bàn massage chuyên nghiệp để phục vụ trị liệu ngay tại phòng.\n\nKhi lưu trú tại đây, quý khách được cấp đặc quyền vô hạn (Unlimited Privilege). Một Đầu bếp chuẩn 5 sao và một chuyên gia pha chế (Bartender) luôn túc trực tại căn bếp riêng của phòng để chế biến bất cứ món ăn nào quý khách muốn vào bất cứ thời điểm nào. Đi kèm với đó là một đội ngũ vệ sĩ vòng ngoài luôn đảm bảo không gian nghỉ dưỡng của bạn không bao giờ bị xâm phạm.",
    features: ["Diện tích khổng lồ 400m² chiếm trọn 1 tầng", "Hệ thống an ninh tối đa với kính chống đạn 3 lớp", "Phòng ăn Hoàng gia dành cho 12 khách VIP", "Khu Spa, Gym, Sauna & Rạp chiếu phim tư nhân"],
    amenities: ["Đầu bếp riêng & Vệ sĩ túc trực theo yêu cầu", "Chuyên cơ trực thăng hoặc xe Maybach đưa đón", "Dịch vụ Spa trị liệu miễn phí mỗi ngày tại phòng", "Miễn phí toàn bộ các dịch vụ ăn uống trong Hotel"]
  },
  {
    id: "beachfront-villa",
    title: "Beachfront Pool Villa 2 Bedrooms",
    subTitle: "Ốc đảo nhiệt đới riêng tư, nơi thềm nhà chạm vào sóng biển.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600",
    description: "Nếu bạn đang tìm kiếm một nơi ẩn náu hoàn toàn thoát khỏi sự ồn ào của đô thị, Beachfront Pool Villa là lựa chọn không thể tuyệt vời hơn. Căn biệt thự nằm nép mình duyên dáng dưới rặng dừa xanh ngát, chỉ cách mép nước đúng 10 mét. Bạn có thể bước từ phòng ngủ, đi qua thảm cỏ xanh mướt và ngay lập tức cảm nhận bờ cát trắng mịn luồn qua kẽ chân.\n\nKiến trúc của biệt thự là sự giao thoa tuyệt đẹp giữa phong cách Indochine (Đông Dương) hoài cổ và sự tối giản của kiến trúc đương đại. Mái ngói vòm cong, gạch bông gió kết hợp với cửa kính trượt khổ lớn giúp không gian bên trong và bên ngoài hòa quyện làm một. Bao gồm 2 phòng ngủ rộng rãi ở hai cánh của biệt thự, đảm bảo sự riêng tư tuyệt đối nhưng vẫn kết nối chung qua phòng khách trung tâm.\n\nĐiểm nhấn rực rỡ nhất của Villa là hồ bơi vô cực nước ngọt ngoài trời rộng 40m2, được bao quanh bởi một khu vườn nhiệt đới tư nhân rực rỡ hoa giấy và cọ lùn. Trải nghiệm được khách hàng yêu thích nhất tại đây chính là gọi dịch vụ Floating Breakfast (Bữa sáng nổi). Những chiếc khay mây tre đan chứa đầy bánh sừng bò, trái cây, trứng benedict trôi lững lờ trên mặt hồ bơi dưới ánh nắng sớm sẽ tạo nên những bức ảnh check-in đẹp vô thực.\n\nPhòng tắm của biệt thự thiết kế theo không gian mở (Outdoor concept). Ngoài bồn tắm đá mài đặt trong nhà, bạn còn có một khu vực tắm vòi sen ngoài trời (Outdoor Shower) được rào chắn kín đáo bằng các phên tre tự nhiên. Cảm giác tắm dưới vòi sen lộ thiên, ngước nhìn lên bầu trời sao ban đêm và nghe tiếng côn trùng rỉ rả là một sự giải phóng tinh thần mạnh mẽ.",
    features: ["Diện tích tổng khu 180m² (Bao gồm sân vườn)", "Hồ bơi vô cực 40m² ngoài trời riêng biệt", "Lối đi rải sỏi dẫn thẳng xuống bãi biển", "Phòng tắm thiết kế lộ thiên giao hòa thiên nhiên"],
    amenities: ["Floating Breakfast (Bữa sáng nổi trên hồ bơi)", "Setup tiệc nướng BBQ hải sản tại vườn", "Cung cấp xe đạp địa hình miễn phí", "Võng lưới thư giãn dưới rặng dừa"]
  },
  {
    id: "overwater-bungalow",
    title: "Overwater Marina Bungalow",
    subTitle: "Viên ngọc quý nổi bồng bềnh trên mặt đại dương xanh thẳm.",
    image: "https://images.unsplash.com/photo-1439130490301-25e322d88054?auto=format&fit=crop&w=1600",
    description: "Lấy cảm hứng từ những khu nghỉ dưỡng thiên đường danh tiếng tại Maldives hay Bora Bora, các căn Bungalow nổi trên mặt nước (Overwater Bungalow) của chúng tôi là tuyệt tác độc bản, mang đến trải nghiệm lãng mạn và bay bổng nhất. Đây là món quà hoàn hảo dành cho các cặp đôi trong tuần trăng mật hoặc lễ kỷ niệm ngày cưới.\n\nĐược xây dựng hoàn toàn trên những hệ cọc gỗ vững chắc vươn ra khỏi bờ biển, căn Bungalow có hình dáng như những chiếc thuyền buồm đang rẽ sóng. Sàn nhà ở khu vực phòng khách được lắp đặt một mặt kính cường lực chịu lực trong suốt. Ngay trong chính căn phòng của mình, bạn có thể ngồi trên sofa, nhâm nhi ly trà nóng và ngắm nhìn từng đàn cá nhiệt đới đủ màu sắc bơi lội qua lại ngay dưới chân mình.\n\nSân hiên ngoài trời (Sun deck) của Bungalow là một thế giới thư giãn tuyệt đối. Được trang bị một võng lưới bện thừng căng ngay trên mặt biển, nơi bạn có thể nằm nghe gió hát và thả hồn vào không trung. Đặc biệt, có một bậc thang bằng gỗ dẫn trực tiếp từ sân hiên xuống làn nước biển trong vắt. Bạn có thể đeo kính lặn và bắt đầu hành trình khám phá rạn san hô bất cứ lúc nào.\n\nNội thất bên trong ưu tiên sử dụng các vật liệu mộc mạc mang tính bản địa như mây, tre đan, mái lá cọ tự nhiên nhưng được xử lý kỹ thuật cao để mang lại cảm giác sang trọng. Buổi tối, nhân viên của chúng tôi sẽ chuẩn bị một bồn tắm nước ấm ngập tràn cánh hoa hồng đỏ, thắp sáng bằng nến thơm tinh dầu. Thưởng thức ly Champagne sủi tăm trong không gian huyền ảo, giữa tiếng sóng biển rì rào sẽ là một ký ức thăng hoa không thể nào quên.",
    features: ["Diện tích 65m² lơ lửng hoàn toàn trên mặt biển", "Sàn kính cường lực trong suốt ngắm đại dương", "Bậc thang gỗ dẫn trực tiếp xuống biển", "Võng lưới bện thừng căng trên mặt nước"],
    amenities: ["Set up phòng trăng mật vô cùng lãng mạn", "Trải nghiệm bồn tắm rắc hoa hồng tươi & Nến", "Dịch vụ đưa đón từ sảnh ra phòng bằng Cano", "Cung cấp thuyền Kayak & SUP trong suốt miễn phí"]
  }
];

export default function RoomDetailsArticles() {
  const navigate = useNavigate();
  const location = useLocation();
  const articleRefs = useRef({});
  const [activeId, setActiveId] = useState(ROOM_ARTICLES[0].id);

  useEffect(() => {
    const targetId = location.state?.scrollToId; 
    const targetIndex = location.state?.roomIndex;

    let targetElement = null;
    let mappedId = ROOM_ARTICLES[0].id;

    if (targetId && articleRefs.current[targetId]) {
      targetElement = articleRefs.current[targetId];
      mappedId = targetId;
    } else if (targetIndex !== undefined && ROOM_ARTICLES[targetIndex]) {
      mappedId = ROOM_ARTICLES[targetIndex].id;
      targetElement = articleRefs.current[mappedId];
    }

    if (targetElement) {
      setActiveId(mappedId);
      setTimeout(() => {
        const headerOffset = 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 300);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      let currentActiveId = activeId;

      ROOM_ARTICLES.forEach(room => {
        const element = articleRefs.current[room.id];
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            currentActiveId = room.id;
          }
        }
      });
      if (currentActiveId !== activeId) setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeId]);

  const handleMenuClick = (id) => {
    const element = articleRefs.current[id];
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: THEME.GRAY_BG, minHeight: '100vh', paddingBottom: 50, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* HEADER CỐ ĐỊNH: Chuyển sang position 'sticky' để đảm bảo luôn bám sát trên cùng màn hình khi cuộn */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: THEME.WHITE, borderBottom: `1px solid ${THEME.BORDER}`, padding: '16px 0', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button 
            type="text" 
            icon={<CaretLeft size={22} weight="bold" />} 
            onClick={handleGoBack} 
            style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: THEME.NAVY, padding: '0', fontSize: 16 }}
          >
            QUAY LẠI DANH SÁCH
          </Button>
          <Title level={4} style={{ margin: 0, fontFamily: '"Source Serif 4", serif', color: THEME.GOLD, letterSpacing: 2, textTransform: 'uppercase' }}>
            ABCHotel
          </Title>
          <div style={{ width: 150 }}></div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '40px auto 0', padding: '0 30px' }}>
        <Row gutter={60}>
          
          <Col xs={0} lg={6}>
            <Affix offsetTop={120}>
              <div style={{ paddingRight: 20 }}>
                <Text strong style={{ fontSize: 13, color: THEME.TEXT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 25, display: 'block', opacity: 0.7 }}>
                  Mục lục bài viết
                </Text>
                <div style={{ borderLeft: `2px solid ${THEME.BORDER}`, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {ROOM_ARTICLES.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => handleMenuClick(room.id)}
                      style={{
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1.5,
                        fontWeight: activeId === room.id ? 700 : 500,
                        color: activeId === room.id ? THEME.DARK_RED : THEME.TEXT,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        padding: '2px 0'
                      }}
                    >
                      {activeId === room.id && (
                        <div style={{ position: 'absolute', left: -26, top: 8, width: 10, height: 10, borderRadius: '50%', backgroundColor: THEME.DARK_RED, border: `2px solid ${THEME.WHITE}` }} />
                      )}
                      {room.title}
                    </div>
                  ))}
                </div>
              </div>
            </Affix>
          </Col>

          <Col xs={24} lg={18}>
            {ROOM_ARTICLES.map((room, index) => (
              <div 
                key={room.id} 
                ref={el => articleRefs.current[room.id] = el}
                style={{ marginBottom: 120, animation: 'fadeIn 0.8s ease' }}
              >
                <div style={{ backgroundColor: THEME.WHITE, borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  
                  <div style={{ position: 'relative', height: 550 }}>
                    <img src={room.image} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 30, left: 30 }}>
                      <Tag color="rgba(13, 24, 33, 0.7)" style={{ backdropFilter: 'blur(8px)', border: 'none', padding: '8px 16px', fontSize: 14, borderRadius: 30, fontWeight: 600 }}>
                        <Space><MapPin weight="fill" color={THEME.GOLD} /> {index < 5 ? 'Phân khu Nghỉ dưỡng' : 'Phân khu Siêu sang'}</Space>
                      </Tag>
                    </div>
                  </div>
                  
                  <div style={{ padding: '60px 70px' }}>
                    
                    <Space align="center" style={{ marginBottom: 15 }}>
                      <Star weight="fill" color={THEME.GOLD} size={20} />
                      <Text style={{ color: THEME.GOLD, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: 13 }}>
                        Bộ Sưu Tập Phòng Số 0{index + 1}
                      </Text>
                    </Space>

                    <Title level={1} style={{ margin: '0 0 20px 0', fontFamily: '"Source Serif 4", serif', color: THEME.NAVY, fontSize: 42, lineHeight: 1.2 }}>
                      {room.title}
                    </Title>
                    
                    <Text style={{ fontSize: 20, color: THEME.DARK_RED, fontStyle: 'italic', fontFamily: '"Source Serif 4", serif', display: 'block', borderLeft: `4px solid ${THEME.GOLD}`, paddingLeft: 20, marginBottom: 40 }}>
                      "{room.subTitle}"
                    </Text>
                    
                    <div className="magazine-content" style={{ color: THEME.TEXT, fontSize: 17, lineHeight: 2, textAlign: 'justify' }}>
                      {room.description.split('\n\n').map((para, i) => (
                        <Paragraph key={i} style={{ marginBottom: 28, fontSize: 17, color: '#475569' }}>
                          {para}
                        </Paragraph>
                      ))}
                    </div>

                    <Divider style={{ borderColor: THEME.BORDER, margin: '50px 0' }} />

                    <Row gutter={[50, 40]}>
                      <Col xs={24} md={12}>
                        <Title level={5} style={{ color: THEME.NAVY, marginBottom: 25, textTransform: 'uppercase', letterSpacing: 1, fontSize: 16 }}>
                          Thông số & Kiến trúc
                        </Title>
                        <List
                          dataSource={room.features}
                          renderItem={item => (
                            <List.Item style={{ border: 'none', padding: '12px 0', display: 'flex', justifyContent: 'flex-start' }}>
                              <CheckCircle size={22} color={THEME.GOLD} weight="fill" style={{ marginRight: 15, marginTop: 3 }} /> 
                              <Text style={{ fontSize: 16, color: THEME.NAVY, fontWeight: 500 }}>{item}</Text>
                            </List.Item>
                          )}
                        />
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <Title level={5} style={{ color: THEME.NAVY, marginBottom: 25, textTransform: 'uppercase', letterSpacing: 1, fontSize: 16 }}>
                          Tiện ích Tôn vinh Đặc quyền
                        </Title>
                        <Row gutter={[20, 24]}>
                          {room.amenities.map((am, i) => (
                            <Col span={24} key={i}>
                              <Space align="start">
                                <div style={{ backgroundColor: THEME.GRAY_BG, padding: 8, borderRadius: '50%', color: THEME.DARK_RED }}>
                                  <Star weight="bold" size={16} />
                                </div>
                                <Text style={{ color: THEME.NAVY, fontSize: 16, lineHeight: '32px' }}>{am}</Text>
                              </Space>
                            </Col>
                          ))}
                        </Row>
                      </Col>
                    </Row>
                    
                    {/* Đã gỡ bỏ toàn bộ cụm nút BẮT ĐẦU KỲ NGHỈ TẠI ĐÂY theo yêu cầu của bạn */}

                  </div>
                </div>
              </div>
            ))}
          </Col>
        </Row>
      </div>

      <Affix style={{ position: 'fixed', bottom: 40, right: 40 }}>
        <Button 
          type="primary" 
          shape="circle" 
          icon={<CaretUp size={24} />} 
          size="large"
          onClick={scrollToTop}
          style={{ width: 55, height: 55, backgroundColor: THEME.NAVY, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
        />
      </Affix>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .magazine-content p::first-letter {
          float: left;
          font-size: 3.5rem;
          line-height: 0.8;
          padding-right: 12px;
          padding-top: 8px;
          font-family: 'Source Serif 4', serif;
          color: ${THEME.NAVY};
          font-weight: 700;
        }
        .magazine-content p:not(:first-child)::first-letter {
          float: none; font-size: inherit; line-height: inherit; padding: 0; font-family: inherit; color: inherit; font-weight: inherit;
        }
        @media (max-width: 991px) {
          .ant-col-lg-18 { padding: 0 !important; }
          .magazine-content { padding: 30px !important; }
        }
      `}</style>
    </div>
  );
}